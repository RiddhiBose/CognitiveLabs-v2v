import { supabase } from '../supabase/client';
import type { Notification, NotificationType, NotificationPreferences } from '../../types';
import { parseError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import TavilyService from '../ai/tavilyService';
import GeminiService from '../ai/geminiService';
import GroqService from '../ai/groqService';
import OpenRouterService from '../ai/openRouterService';

export interface NotificationServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

// Canonical display type helper
function canonicalType(t: string): string {
  if (t === 'financial-literacy' || t === 'financial-literacy-course') return 'financial_literacy';
  return t;
}

// Simple string hash generator for duplicate checking
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

const NotificationService = {
  /**
   * Fetch all notifications for a user.
   */
  async getNotifications(userId: string, limit = 50): Promise<NotificationServiceResult<Notification[]>> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('is_read', { ascending: true }) // Unread first
      .order('created_at', { ascending: false }) // Newest first
      .limit(limit);

    if (error) return { data: null, error: parseError(error) };
    return { data: data as Notification[], error: null };
  },

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<NotificationServiceResult<number>> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return { data: null, error: parseError(error) };
    return { data: count ?? 0, error: null };
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<NotificationServiceResult> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<NotificationServiceResult> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  /**
   * Delete a notification.
   */
  async deleteNotification(notificationId: string): Promise<NotificationServiceResult> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  /**
   * Subscribe to real-time notifications for a user.
   */
  subscribeToNotifications(userId: string, onNew: (notification: Notification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onNew(payload.new as Notification),
      )
      .subscribe();
  },

  // ── Preferences Management ──────────────────────────────────────────────────

  /**
   * Fetch notification preferences for a user. Creates defaults if not found.
   */
  async getPreferences(userId: string): Promise<NotificationServiceResult<NotificationPreferences>> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return { data: null, error: parseError(error) };
    
    if (!data) {
      // Initialize default preferences
      const defaultPrefs = {
        user_id: userId,
        scholarship_updates: true,
        loan_updates: true,
        government_scheme_updates: true,
        financial_literacy_updates: true,
        mentorship_notifications: true,
        message_notifications: true,
      };
      
      const { data: inserted, error: insertErr } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();
        
      if (insertErr) return { data: null, error: parseError(insertErr) };
      return { data: inserted as NotificationPreferences, error: null };
    }
    
    return { data: data as NotificationPreferences, error: null };
  },

  /**
   * Update notification preferences.
   */
  async updatePreferences(
    userId: string,
    prefs: Partial<NotificationPreferences>,
  ): Promise<NotificationServiceResult<NotificationPreferences>> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as NotificationPreferences, error: null };
  },

  // ── Create Notification with Preference Enforcement ─────────────────────────

  /**
   * Create a notification. Respects user preferences.
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'general',
    relatedId?: string | null,
    relatedType?: string | null,
    category?: string | null,
    source?: string | null,
  ): Promise<NotificationServiceResult<Notification>> {
    // Resolve category and source based on type if not explicitly supplied
    let resolvedCategory = category;
    let resolvedSource = source;

    if (!resolvedCategory) {
      if (type.startsWith('mentorship_') || type === 'mentor_match') {
        resolvedCategory = 'mentorship';
        resolvedSource = 'Mentorship';
      } else if (type === 'message_received' || type === 'unread_message') {
        resolvedCategory = 'messaging';
        resolvedSource = 'Chat';
      } else if (type === 'welcome' || type === 'feature_announcement' || type === 'system') {
        resolvedCategory = 'system';
        resolvedSource = 'System';
      } else {
        resolvedCategory = 'general';
        resolvedSource = 'System';
      }
    }

    // Enforce user notification preferences
    const { data: prefs } = await this.getPreferences(userId);
    let shouldNotify = true;

    if (prefs) {
      const cat = resolvedCategory.toLowerCase();
      if (cat === 'scholarship') {
        shouldNotify = prefs.scholarship_updates;
      } else if (cat === 'loan' || cat === 'education_loan') {
        shouldNotify = prefs.loan_updates;
      } else if (cat === 'government_scheme' || cat === 'startup_funding') {
        shouldNotify = prefs.government_scheme_updates;
      } else if (cat === 'financial_literacy' || cat === 'financial-literacy' || cat === 'financial-literacy-course') {
        shouldNotify = prefs.financial_literacy_updates;
      } else if (cat === 'mentorship') {
        shouldNotify = prefs.mentorship_notifications;
      } else if (cat === 'messaging') {
        shouldNotify = prefs.message_notifications;
      }
    }

    if (!shouldNotify) {
      logger.info('NotificationService', `Skipping notification due to user preferences. category=${resolvedCategory}`);
      return { data: null, error: null };
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        related_id: relatedId ?? null,
        related_type: relatedType ?? null,
        category: resolvedCategory,
        source: resolvedSource ?? 'System',
      })
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as Notification, error: null };
  },

  // ── AI and Rule-Based Comparison Engine ─────────────────────────────────────

  /**
   * Run the AI fallback priority chain to compare snaps.
   */
  async triggerAIUpdateAnalysis(
    itemType: string,
    oldSnapshot: any,
    searchResults: any[],
  ): Promise<{ updateDetected: boolean; title: string | null; description: string | null; updatedSnapshot: any }> {
    const formattedResults = TavilyService.formatForPrompt(searchResults);
    const prompt = `
You are an AI assistant designed to monitor and compare updates for user recommendations.

Compare the old recommendation data with the latest official information retrieved from web search.
Determine if there are any meaningful differences (e.g. deadline changes, interest rate changes, eligibility changes, course updates, admission details, or funding amount updates).

Old Recommendation Data:
${JSON.stringify(oldSnapshot, null, 2)}

Latest Official Information (Search Results):
${formattedResults}

CRITICAL RULES:
1. Detect meaningful differences ONLY. Do NOT notify about minor wording tweaks, description changes, or score adjustments.
2. Only notify if there are concrete updates (e.g. date extended/changed, rate changed, fee changed, new benefits).
3. If no meaningful updates are detected, respond with exactly: NO_UPDATE.
4. If a meaningful update IS detected, respond with a JSON object of the following format, and nothing else (no markdown blocks, no code fences):
{
  "updateDetected": true,
  "title": "Short title describing the update",
  "description": "Concise description of what changed (e.g. 'Deadline for XYZ Scholarship has been extended to 31 August.')",
  "updatedSnapshot": { ...updated fields merged into the old snapshot structure ... }
}
    `.trim();

    const request = { prompt, searchResults };

    // 1. Gemini (Priority 1)
    if (GeminiService.isConfigured()) {
      try {
        logger.info('NotificationService', 'Triggering Gemini update analysis...');
        const result = await GeminiService.generate(request);
        if (result.data?.text) {
          const res = this.parseAIResponse(result.data.text, oldSnapshot);
          if (res) return res;
        }
      } catch (err) {
        logger.warn('NotificationService', 'Gemini analysis failed, falling back...', err);
      }
    }

    // 2. Groq (Priority 2)
    if (GroqService.isConfigured()) {
      try {
        logger.info('NotificationService', 'Triggering Groq update analysis...');
        const result = await GroqService.generate(request);
        if (result.data?.text) {
          const res = this.parseAIResponse(result.data.text, oldSnapshot);
          if (res) return res;
        }
      } catch (err) {
        logger.warn('NotificationService', 'Groq analysis failed, falling back...', err);
      }
    }

    // 3. OpenRouter (Priority 3)
    if (OpenRouterService.isConfigured()) {
      try {
        logger.info('NotificationService', 'Triggering OpenRouter update analysis...');
        const result = await OpenRouterService.generate(request);
        if (result.data?.text) {
          const res = this.parseAIResponse(result.data.text, oldSnapshot);
          if (res) return res;
        }
      } catch (err) {
        logger.warn('NotificationService', 'OpenRouter analysis failed, falling back...', err);
      }
    }

    // 4. Rule-based Comparison Fallback
    logger.info('NotificationService', 'All AI providers failed. Using rule-based fallback comparison.');
    return this.compareRuleBased(oldSnapshot, searchResults, itemType);
  },

  /**
   * Helper to parse and clean AI JSON response.
   */
  parseAIResponse(text: string, oldSnapshot: any): any | null {
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    if (clean === 'NO_UPDATE') {
      return { updateDetected: false, title: null, description: null, updatedSnapshot: null };
    }
    try {
      const parsed = JSON.parse(clean);
      if (parsed && typeof parsed === 'object') {
        return {
          updateDetected: !!parsed.updateDetected,
          title: parsed.title || 'Recommendation Updated',
          description: parsed.description || 'Changes were detected.',
          updatedSnapshot: parsed.updatedSnapshot || oldSnapshot,
        };
      }
    } catch {
      logger.warn('NotificationService', 'AI returned malformed JSON, couldn\'t parse: ' + clean);
    }
    return null;
  },

  /**
   * Rule-based comparison fallback when AI models are unavailable.
   */
  compareRuleBased(
    oldSnapshot: any,
    searchResults: any[],
    itemType: string,
  ): { updateDetected: boolean; title: string | null; description: string | null; updatedSnapshot: any } {
    const text = searchResults.map((r) => `${r.title} ${r.content}`).join(' ').toLowerCase();
    const updates: string[] = [];
    const updatedSnapshot = { ...oldSnapshot };

    // Compare Interest Rates (loans)
    if (itemType === 'loan' || itemType === 'education_loan') {
      const oldRate = oldSnapshot?.interestRate || oldSnapshot?.metadata?.interestRate;
      if (oldRate) {
        const rateRegex = /(\d+(?:\.\d+)?)\s*%/g;
        let match;
        const foundRates = new Set<string>();
        while ((match = rateRegex.exec(text)) !== null) {
          foundRates.add(match[0]);
        }
        if (foundRates.size > 0 && !Array.from(foundRates).some((r) => r.includes(parseFloat(oldRate).toString()))) {
          const newRate = Array.from(foundRates)[0];
          updates.push(`Interest rate updated from ${oldRate} to ${newRate}.`);
          updatedSnapshot.interestRate = newRate;
          if (updatedSnapshot.metadata) updatedSnapshot.metadata.interestRate = newRate;
        }
      }
    }

    // Compare Deadlines (scholarships, startup funding, college, courses)
    const oldDeadline = oldSnapshot?.deadline || oldSnapshot?.metadata?.deadline || oldSnapshot?.admissionDeadline;
    if (oldDeadline) {
      const oldDeadlineClean = oldDeadline.toString().toLowerCase();
      const hasOldDeadline = text.includes(oldDeadlineClean);
      if (!hasOldDeadline) {
        const idx = text.indexOf('deadline');
        if (idx !== -1) {
          const snippet = text.slice(idx, idx + 200);
          const dateMatch = snippet.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
          if (dateMatch) {
            const newDeadline = dateMatch[0];
            updates.push(`Deadline has changed from ${oldDeadline} to ${newDeadline}.`);
            if (updatedSnapshot.deadline) updatedSnapshot.deadline = newDeadline;
            if (updatedSnapshot.metadata) updatedSnapshot.metadata.deadline = newDeadline;
          }
        }
      }
    }

    // Compare Amounts (scholarships, loans, startup schemes)
    const oldAmount = oldSnapshot?.amount || oldSnapshot?.maxAmount || oldSnapshot?.metadata?.amount || oldSnapshot?.metadata?.maxAmount;
    if (oldAmount) {
      const oldAmountStr = oldAmount.toString().toLowerCase();
      if (!text.includes(oldAmountStr)) {
        const amountRegex = /(?:rs\.?|inr|₹|usd|\$)\s*(\d+(?:,\d+)*(?:\.\d+)?\s*(?:lakh|crore|million|k|thousand)?)/g;
        let match;
        const foundAmounts = new Set<string>();
        while ((match = amountRegex.exec(text)) !== null) {
          foundAmounts.add(match[0]);
        }
        if (foundAmounts.size > 0) {
          const newAmount = Array.from(foundAmounts)[0];
          updates.push(`Funding benefits updated to ${newAmount}.`);
          if (updatedSnapshot.amount) updatedSnapshot.amount = newAmount;
          if (updatedSnapshot.maxAmount) updatedSnapshot.maxAmount = newAmount;
        }
      }
    }

    if (updates.length > 0) {
      return {
        updateDetected: true,
        title: `${oldSnapshot.title || 'Saved Recommendation'} Update`,
        description: updates.join(' '),
        updatedSnapshot,
      };
    }

    return {
      updateDetected: false,
      title: null,
      description: null,
      updatedSnapshot: null,
    };
  },

  // ── Periodic Recommendation Monitoring pipeline ─────────────────────────────

  /**
   * Checks the user's saved recommendations for changes and generates alerts.
   */
  async checkSavedRecommendationsForUpdates(userId: string): Promise<NotificationServiceResult<{ checked: number; updatesFound: number }>> {
    logger.info('NotificationService', `Starting checkSavedRecommendationsForUpdates for user: ${userId}`);

    try {
      // 1. Fetch saved items for this user
      const { data: savedItems, error: fetchErr } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId);

      if (fetchErr) return { data: null, error: parseError(fetchErr) };
      if (!savedItems || savedItems.length === 0) {
        return { data: { checked: 0, updatesFound: 0 }, error: null };
      }

      // Filter updateable types (exclude mentor)
      const updateableItems = savedItems.filter((item) => {
        const t = canonicalType(item.item_type);
        return ['college', 'scholarship', 'loan', 'government_scheme', 'startup_funding', 'financial_literacy'].includes(t);
      });

      // 2. Filter by threshold (last checked > 6 hours ago or never)
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const itemsToCheck = updateableItems.filter((item) => {
        if (!item.last_checked_at) return true;
        return new Date(item.last_checked_at) < sixHoursAgo;
      });

      logger.info('NotificationService', `Checking ${itemsToCheck.length} of ${updateableItems.length} saved recommendations for updates...`);

      let updatesFound = 0;

      for (const item of itemsToCheck) {
        try {
          const snapshot = item.recommendation_snapshot;
          if (!snapshot) continue;

          // Resolve preferred domains based on type
          let preferredDomains: string[] = [];
          const t = canonicalType(item.item_type);

          if (t === 'scholarship') {
            preferredDomains = ['scholarships.gov.in', 'aicte-india.org', 'ugc.ac.in'];
          } else if (t === 'loan') {
            preferredDomains = ['rbi.org.in', 'vidyalakshmi.co.in'];
          } else if (t === 'government_scheme' || t === 'startup_funding') {
            preferredDomains = ['india.gov.in', 'mygov.in', 'startupindia.gov.in'];
          } else if (t === 'financial_literacy') {
            preferredDomains = ['nism.ac.in', 'rbi.org.in', 'sebi.gov.in'];
          } else if (t === 'college') {
            preferredDomains = ['nirfindia.org', 'aicte-india.org', 'ugc.ac.in'];
          }

          if (item.official_website) {
            try {
              const domain = new URL(item.official_website).hostname.replace(/^www\./, '');
              preferredDomains.push(domain);
            } catch { /* ignore invalid URL */ }
          }

          // Tavily Search query
          const searchQuery = `"${item.item_title}" official site updates news eligibility deadline 2026`;
          logger.info('NotificationService', `Running search query: "${searchQuery}"`);

          const tavilyResult = await TavilyService.search({
            query: searchQuery,
            preferredDomains,
            maxResults: 5,
            searchDepth: 'basic',
          });

          // Update last checked time immediately to throttle repeated checking
          await supabase
            .from('saved_items')
            .update({ last_checked_at: new Date().toISOString() })
            .eq('id', item.id);

          if (tavilyResult.error || !tavilyResult.data?.results?.length) {
            logger.warn('NotificationService', `No search results for saved item: "${item.item_title}"`, tavilyResult.error);
            continue;
          }

          const filteredResults = TavilyService.filterByScore(tavilyResult.data.results, 0.2);
          if (filteredResults.length === 0) continue;

          // AI / Rule-based comparison
          const analysis = await this.triggerAIUpdateAnalysis(t, snapshot, filteredResults);

          if (analysis.updateDetected && analysis.description) {
            const updateHash = generateHash(analysis.description);

            // Double check duplicate tracker
            const { data: tracker } = await supabase
              .from('notification_tracker')
              .select('id')
              .eq('user_id', userId)
              .eq('item_type', item.item_type)
              .eq('item_id', item.item_id)
              .eq('update_hash', updateHash)
              .maybeSingle();

            if (!tracker) {
              // Store notified event in tracker
              await supabase
                .from('notification_tracker')
                .insert({
                  user_id: userId,
                  item_type: item.item_type,
                  item_id: item.item_id,
                  update_hash: updateHash,
                });

              // Create user notification
              let sourceName = item.source_url ? new URL(item.source_url).hostname.replace(/^www\./, '') : 'Official Source';
              try {
                if (item.official_website) {
                  sourceName = new URL(item.official_website).hostname.replace(/^www\./, '');
                }
              } catch { /* ignore */ }

              await this.createNotification(
                userId,
                analysis.title || 'Recommendation Update Detected',
                analysis.description,
                'recommendation_update',
                item.item_id,
                item.item_type,
                canonicalType(item.item_type),
                sourceName,
              );

              // Update the saved snapshot with latest fields
              await supabase
                .from('saved_items')
                .update({
                  recommendation_snapshot: analysis.updatedSnapshot,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.id);

              updatesFound++;
              logger.info('NotificationService', `Update detected and notified for: "${item.item_title}"`);
            }
          }
        } catch (itemErr) {
          logger.error('NotificationService', `Error checking item ID ${item.id}`, itemErr);
        }
      }

      return { data: { checked: itemsToCheck.length, updatesFound }, error: null };
    } catch (err) {
      return { data: null, error: parseError(err) };
    }
  },

  /**
   * Periodic reminder for unread messages.
   */
  async checkForUnreadMessagesReminder(userId: string): Promise<void> {
    try {
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id, sender_id, connection_id, created_at')
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (!unreadMessages || unreadMessages.length === 0) return;

      const connectionGroups = new Map<string, typeof unreadMessages>();
      for (const m of unreadMessages) {
        if (!connectionGroups.has(m.connection_id)) {
          connectionGroups.set(m.connection_id, []);
        }
        connectionGroups.get(m.connection_id)!.push(m);
      }

      for (const [connId, msgs] of connectionGroups.entries()) {
        const count = msgs.length;
        const updateHash = `unread_reminder_${connId}_count_${count}`;

        const { data: tracker } = await supabase
          .from('notification_tracker')
          .select('id')
          .eq('user_id', userId)
          .eq('item_type', 'chat')
          .eq('item_id', connId)
          .eq('update_hash', updateHash)
          .maybeSingle();

        if (!tracker) {
          const senderId = msgs[0].sender_id;
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', senderId)
            .single();
          const senderName = (senderProfile as { full_name?: string } | null)?.full_name ?? 'Someone';

          await supabase.from('notification_tracker').insert({
            user_id: userId,
            item_type: 'chat',
            item_id: connId,
            update_hash: updateHash,
          });

          await this.createNotification(
            userId,
            'Unread Messages Reminder',
            `You have ${count} unread message${count > 1 ? 's' : ''} from ${senderName}.`,
            'unread_message',
            connId,
            'chat',
            'messaging',
            'Chat',
          );
        }
      }
    } catch (err) {
      logger.error('NotificationService', 'Failed to run unread message reminder check', err);
    }
  },

  /**
   * Initializes background updates for the user. Throttles checking to every 6 hours.
   */
  startBackgroundScheduler(userId: string): void {
    const checkKey = `last_notification_check_${userId}`;
    const runChecks = async () => {
      logger.info('NotificationService', 'Running background notification update checks...');
      localStorage.setItem(checkKey, Date.now().toString());

      // 1. Check saved recommendations for external updates
      this.checkSavedRecommendationsForUpdates(userId);

      // 2. Check for unread message reminders
      this.checkForUnreadMessagesReminder(userId);
    };

    const lastCheck = localStorage.getItem(checkKey);
    const sixHours = 6 * 60 * 60 * 1000;

    if (!lastCheck || Date.now() - parseInt(lastCheck, 10) > sixHours) {
      runChecks();
    }

    // Set interval to check every 6 hours
    const intervalId = setInterval(runChecks, sixHours);

    // Clean up interval when user changes or session ends
    window.addEventListener('beforeunload', () => clearInterval(intervalId));
  },
};

export default NotificationService;
