/**
 * MentorshipService
 *
 * Full AI-powered mentor matching with Supabase-first filtering.
 * Pipeline: Supabase filter → shortlist → AI Provider Manager → rule-based fallback → ranked results
 *
 * Provider priority: Gemini → Groq → OpenRouter → Rule-based engine
 * Never sends the full database to AI — always shortlist first.
 * All business logic lives here; zero logic in React components.
 */

import { supabase } from '../supabase/client';
import GeminiService from '../ai/geminiService';
import GroqService from '../ai/groqService';
import OpenRouterService from '../ai/openRouterService';
import { parseError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { COMPATIBILITY_WEIGHTS, MENTORSHIP_AI_SHORTLIST_SIZE, MENTORSHIP_MIN_CANDIDATES_FOR_AI } from '../../constants';
import type {
  MentorshipServiceResult,
  MentorCandidate,
  RankedMentor,
  CompatibilityResult,
  LearnerPreferences,
  LearnerPreferencesInput,
  MentorPreferences,
  MentorPreferencesInput,
  MentorshipRequest,
  MentorshipRequestStatus,
  MentorshipRequestWithLearner,
  MentorshipConnection,
} from '../../types';
import type { Profile } from '../../types';

// ─── Rule-based Compatibility Engine ─────────────────────────────────────────
// Used when all AI providers fail. Returns identical JSON format to AI providers.
// Priority: same college → same school → same degree → same branch → occupation → role → experience → pref match

function runRuleBasedEngine(
  learner: Profile,
  learnerPrefs: LearnerPreferences | null,
  mentor: MentorCandidate,
): CompatibilityResult {
  let rawScore = 0;
  const reasons: string[] = [];

  // ── Same college (dedicated college_name field, highest priority) ─────────
  const learnerCollege = (learner.college_name ?? '').trim().toLowerCase();
  const mentorCollege = (mentor.college_name ?? '').trim().toLowerCase();
  if (learnerCollege && mentorCollege && learnerCollege === mentorCollege) {
    rawScore += COMPATIBILITY_WEIGHTS.sameCollege;
    reasons.push(`Both attended ${mentor.college_name}`);
  }

  // ── Same school (second priority) ─────────────────────────────────────────
  const learnerSchool = (learner.school_name ?? '').trim().toLowerCase();
  const mentorSchool = (mentor.school_name ?? '').trim().toLowerCase();
  if (learnerSchool && mentorSchool && learnerSchool === mentorSchool) {
    // School match gets half the college weight — still significant
    rawScore += Math.round(COMPATIBILITY_WEIGHTS.sameCollege / 2);
    reasons.push(`Both studied at ${mentor.school_name}`);
  }

  // Same degree
  const learnerDeg = (learner.qualification_other ?? learner.qualification ?? '').toLowerCase();
  const mentorDeg = (mentor.qualification_other ?? mentor.qualification ?? '').toLowerCase();
  if (learnerDeg && mentorDeg && learnerDeg === mentorDeg) {
    rawScore += COMPATIBILITY_WEIGHTS.sameDegree;
    reasons.push(`Both completed ${mentor.qualification_other ?? mentor.qualification}`);
  }

  // Same branch / specialization
  const learnerBranch = (learner.specialization ?? '').toLowerCase();
  const mentorBranch = (mentor.specialization ?? '').toLowerCase();
  if (learnerBranch && mentorBranch && learnerBranch === mentorBranch) {
    rawScore += COMPATIBILITY_WEIGHTS.sameBranch;
    reasons.push(`Both specialised in ${mentor.specialization}`);
  }

  // Preferred occupation match
  if (learnerPrefs?.preferred_occupation) {
    const prefOcc = learnerPrefs.preferred_occupation.toLowerCase();
    const mentorOcc = (mentor.occupation ?? mentor.occupation_other ?? mentor.job_title ?? '').toLowerCase();
    if (mentorOcc.includes(prefOcc) || prefOcc.includes(mentorOcc)) {
      rawScore += COMPATIBILITY_WEIGHTS.preferredOccupation;
      reasons.push(`Mentor's occupation matches your preference (${learnerPrefs.preferred_occupation})`);
    }
  }

  // Preferred job role match
  if (learnerPrefs?.preferred_job_role) {
    const prefRole = learnerPrefs.preferred_job_role.toLowerCase();
    const mentorRole = (mentor.job_title ?? '').toLowerCase();
    if (mentorRole.includes(prefRole) || prefRole.includes(mentorRole)) {
      rawScore += COMPATIBILITY_WEIGHTS.preferredJobRole;
      reasons.push(`Mentor's job role matches your preference (${learnerPrefs.preferred_job_role})`);
    }
  }

  // Experience match
  const minExp = learnerPrefs?.preferred_min_experience ?? 0;
  if (minExp === 0 || (mentor.experience != null && mentor.experience >= minExp)) {
    rawScore += COMPATIBILITY_WEIGHTS.experienceMatch;
    if (mentor.experience != null) {
      reasons.push(`Mentor has ${mentor.experience} year${mentor.experience !== 1 ? 's' : ''} of experience`);
    }
  }

  // Mentor preference match — does the mentor's preferred learner profile match this learner?
  const mp = mentor.mentor_preferences;
  if (mp) {
    let prefMatch = true;
    if (mp.preferred_learner_occupation && mp.preferred_learner_occupation !== 'No Preference') {
      const mpOcc = mp.preferred_learner_occupation.toLowerCase();
      const lOcc = (learner.occupation ?? '').toLowerCase();
      if (!lOcc.includes(mpOcc) && !mpOcc.includes(lOcc)) prefMatch = false;
    }
    if (mp.preferred_learner_age_min != null && learner.age != null && learner.age < mp.preferred_learner_age_min) {
      prefMatch = false;
    }
    if (mp.preferred_learner_age_max != null && learner.age != null && learner.age > mp.preferred_learner_age_max) {
      prefMatch = false;
    }
    if (prefMatch) {
      rawScore += COMPATIBILITY_WEIGHTS.mentorPreferenceMatch;
      reasons.push("You match this mentor's preferred learner profile");
    }
  }

  // Normalise to 0-100
  const maxPossible = Object.values(COMPATIBILITY_WEIGHTS).reduce((a, b) => a + b, 0);
  const compatibilityScore = Math.min(100, Math.round((rawScore / maxPossible) * 100));

  if (reasons.length === 0) {
    reasons.push('Potential match based on available profile information');
  }

  return { compatibilityScore, reasons };
}

// ─── AI Provider Manager (Gemini → Groq → OpenRouter → Rule-based) ────────────

async function analyzeCompatibilityWithAI(
  learner: Profile,
  learnerPrefs: LearnerPreferences | null,
  candidates: MentorCandidate[],
): Promise<Map<string, CompatibilityResult>> {
  const results = new Map<string, CompatibilityResult>();

  // Build a minimal prompt payload.
  // Candidates are serialized as "search results" to reuse the existing GeminiRequest interface.
  const candidateSummaries = candidates.map((c, i) => ({
    title: `Mentor_${i + 1}_${c.user_id}`,
    url: `mentor://${c.user_id}`,
    content: JSON.stringify({
      user_id: c.user_id,
      name: c.full_name,
      college: c.college_name,
      school: c.school_name,
      degree: c.qualification_other ?? c.qualification,
      branch: c.specialization,
      occupation: c.occupation_other ?? c.occupation,
      job_title: c.job_title,
      company: c.company,
      experience_years: c.experience,
      state: c.state,
      bio: c.bio?.slice(0, 200),
      mentor_preferences: c.mentor_preferences
        ? {
            preferred_learner_occupation: c.mentor_preferences.preferred_learner_occupation,
            preferred_degree: c.mentor_preferences.preferred_degree,
            preferred_branch: c.mentor_preferences.preferred_branch,
          }
        : null,
    }),
    score: 1.0,
  }));

  const learnerSummary = {
    name: learner.full_name,
    age: learner.age,
    college: learner.college_name,
    school: learner.school_name,
    degree: learner.qualification_other ?? learner.qualification,
    branch: learner.specialization,
    occupation: learner.occupation_other ?? learner.occupation,
    job_title: learner.job_title,
    company: learner.company,
    experience_years: learner.experience,
    state: learner.state,
    bio: learner.bio?.slice(0, 200),
    preferences: learnerPrefs
      ? {
          preferred_occupation: learnerPrefs.preferred_occupation,
          preferred_job_role: learnerPrefs.preferred_job_role,
          preferred_degree: learnerPrefs.preferred_degree,
          preferred_branch: learnerPrefs.preferred_branch,
          preferred_min_experience: learnerPrefs.preferred_min_experience,
        }
      : null,
  };

  const prompt = `
You are a mentorship matching AI for ElevateHer AI.

Analyse each mentor candidate's compatibility with the learner below.
For EVERY candidate, return a JSON object in the results array.

LEARNER PROFILE:
${JSON.stringify(learnerSummary, null, 2)}

MENTOR CANDIDATES (${candidates.length} total):
${candidateSummaries.map((c) => `ID: ${c.title}\n${c.content}`).join('\n\n')}

INSTRUCTIONS:
- Priority order: same college (highest) → same school → same degree → same branch → occupation match → experience → mentor preference match.
- compatibilityScore must be an integer from 0 to 100.
- reasons must be an array of short, specific, factual strings (no free-form paragraphs).
- Return ONLY a valid JSON array. No markdown. No explanation. No code fences.

OUTPUT FORMAT (JSON array, one object per candidate, in the same order as the candidates above):
[
  {
    "user_id": "<exact user_id from candidate>",
    "compatibilityScore": <integer 0-100>,
    "reasons": ["reason 1", "reason 2", ...]
  }
]
`.trim();

  // Try Gemini → Groq → OpenRouter in order
  let rawText: string | null = null;

  if (GeminiService.isConfigured()) {
    logger.info('MentorshipService', 'Calling Gemini for compatibility analysis');
    const res = await GeminiService.generate({ prompt, searchResults: candidateSummaries });
    if (res.data?.text) rawText = res.data.text;
    else logger.warn('MentorshipService', 'Gemini failed', res.error);
  }

  if (!rawText && GroqService.isConfigured()) {
    logger.info('MentorshipService', 'Gemini unavailable — trying Groq');
    const res = await GroqService.generate({ prompt, searchResults: candidateSummaries });
    if (res.data?.text) rawText = res.data.text;
    else logger.warn('MentorshipService', 'Groq failed', res.error);
  }

  if (!rawText && OpenRouterService.isConfigured()) {
    logger.info('MentorshipService', 'Groq unavailable — trying OpenRouter');
    const res = await OpenRouterService.generate({ prompt, searchResults: candidateSummaries });
    if (res.data?.text) rawText = res.data.text;
    else logger.warn('MentorshipService', 'OpenRouter failed', res.error);
  }

  if (rawText) {
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }
      const parsed = JSON.parse(cleaned) as Array<{ user_id: string; compatibilityScore: number; reasons: string[] }>;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.user_id && typeof item.compatibilityScore === 'number') {
            results.set(item.user_id, {
              compatibilityScore: Math.min(100, Math.max(0, Math.round(item.compatibilityScore))),
              reasons: Array.isArray(item.reasons) ? item.reasons : ['AI analysis completed'],
            });
          }
        }
        logger.info('MentorshipService', `AI returned scores for ${results.size} candidates`);
        return results;
      }
    } catch (err) {
      logger.warn('MentorshipService', 'AI response parse failed — falling back to rule-based', err);
    }
  }

  // Rule-based fallback for all candidates
  logger.info('MentorshipService', 'Using rule-based compatibility engine');
  for (const candidate of candidates) {
    results.set(candidate.user_id, runRuleBasedEngine(learner, learnerPrefs, candidate));
  }
  return results;
}

// ─── Main service object ──────────────────────────────────────────────────────

const MentorshipService = {

  // ── Learner preferences ─────────────────────────────────────────────────

  async getLearnerPreferences(userId: string): Promise<MentorshipServiceResult<LearnerPreferences>> {
    const { data, error } = await supabase
      .from('learner_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as LearnerPreferences | null, error: null };
  },

  async upsertLearnerPreferences(
    userId: string,
    input: LearnerPreferencesInput,
  ): Promise<MentorshipServiceResult<LearnerPreferences>> {
    const { data, error } = await supabase
      .from('learner_preferences')
      .upsert({ ...input, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as LearnerPreferences, error: null };
  },

  // ── Mentor preferences ──────────────────────────────────────────────────

  async getMentorPreferences(userId: string): Promise<MentorshipServiceResult<MentorPreferences>> {
    const { data, error } = await supabase
      .from('mentor_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as MentorPreferences | null, error: null };
  },

  async upsertMentorPreferences(
    userId: string,
    input: MentorPreferencesInput,
  ): Promise<MentorshipServiceResult<MentorPreferences>> {
    const { data, error } = await supabase
      .from('mentor_preferences')
      .upsert({ ...input, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as MentorPreferences, error: null };
  },

  // ── Core matching — Supabase filter → AI analysis → ranked results ──────

  async getRecommendedMentors(
    learner: Profile,
    learnerPrefs: LearnerPreferences | null,
  ): Promise<MentorshipServiceResult<RankedMentor[]>> {
    if (learner.role !== 'learner') {
      return { data: null, error: 'Only learners can search for mentors.' };
    }

    // ── Step 1: Supabase filtering (never send full DB to AI) ─────────────
    // Build a scoring query — order by signals most useful for this learner.
    // We fetch up to MENTORSHIP_AI_SHORTLIST_SIZE profiles with role=mentor.

    let query = supabase
      .from('profiles')
      .select(`
        user_id, full_name, age, qualification, qualification_other,
        specialization, occupation, occupation_other, experience,
        job_title, company, industry, state, city, bio, avatar_url,
        college_name, school_name
      `)
      .eq('role', 'mentor')
      .eq('is_profile_complete', true)
      .neq('user_id', learner.user_id);

    // Hard filter: minimum experience from learner preferences
    if (learnerPrefs?.preferred_min_experience && learnerPrefs.preferred_min_experience > 0) {
      query = query.gte('experience', learnerPrefs.preferred_min_experience);
    }

    // Soft priority ordering: same degree first, then same branch, then experience desc
    // Supabase doesn't support multi-column conditional ordering easily in one call,
    // so we fetch the shortlist and sort in JS after adding the preference signals.
    query = query
      .order('experience', { ascending: false })
      .limit(MENTORSHIP_AI_SHORTLIST_SIZE * 3); // over-fetch so we can soft-sort

    const { data: rawCandidates, error: fetchError } = await query;
    if (fetchError) return { data: null, error: parseError(fetchError) };
    if (!rawCandidates || rawCandidates.length === 0) {
      return { data: [], error: null };
    }

    // ── Step 2: Fetch mentor_preferences for all candidates in one query ──
    const candidateUserIds = rawCandidates.map((c: { user_id: string }) => c.user_id);
    const { data: mentorPrefsRows } = await supabase
      .from('mentor_preferences')
      .select('*')
      .in('user_id', candidateUserIds);

    const mentorPrefsMap = new Map<string, MentorPreferences>();
    for (const mp of (mentorPrefsRows ?? [])) {
      mentorPrefsMap.set(mp.user_id, mp as MentorPreferences);
    }

    // ── Step 3: Soft-sort by profile signals to get the best shortlist ────
    type RawCandidate = typeof rawCandidates[number];
    const scored = (rawCandidates as RawCandidate[]).map((c) => {
      let signal = 0;
      const mp = mentorPrefsMap.get(c.user_id) ?? null;

      // Same college → highest signal (dedicated field, first priority)
      const cCollege = (c.college_name ?? '').trim().toLowerCase();
      const lCollege = (learner.college_name ?? '').trim().toLowerCase();
      if (cCollege && lCollege && cCollege === lCollege) signal += 60;

      // Same school → second priority
      const cSchool = (c.school_name ?? '').trim().toLowerCase();
      const lSchool = (learner.school_name ?? '').trim().toLowerCase();
      if (cSchool && lSchool && cSchool === lSchool) signal += 30;

      // Same degree → strong signal
      const cDeg = (c.qualification_other ?? c.qualification ?? '').toLowerCase();
      const lDeg = (learner.qualification_other ?? learner.qualification ?? '').toLowerCase();
      if (cDeg && lDeg && cDeg === lDeg) signal += 20;

      // Same branch → strong signal
      const cBranch = (c.specialization ?? '').toLowerCase();
      const lBranch = (learner.specialization ?? '').toLowerCase();
      if (cBranch && lBranch && cBranch === lBranch) signal += 15;

      // Preferred occupation → medium signal
      if (learnerPrefs?.preferred_occupation) {
        const prefOcc = learnerPrefs.preferred_occupation.toLowerCase();
        const cOcc = (c.occupation_other ?? c.occupation ?? c.job_title ?? '').toLowerCase();
        if (cOcc.includes(prefOcc) || prefOcc.includes(cOcc)) signal += 10;
      }

      // Mentor's preferred learner profile matches → medium signal
      if (mp?.preferred_learner_occupation && mp.preferred_learner_occupation !== 'No Preference') {
        const mpOcc = mp.preferred_learner_occupation.toLowerCase();
        const lOcc = (learner.occupation ?? '').toLowerCase();
        if (lOcc.includes(mpOcc) || mpOcc.includes(lOcc)) signal += 8;
      }

      // Experience rank bonus (tiebreaker)
      signal += Math.min(5, c.experience ?? 0);

      return { ...c, _signal: signal, mentor_preferences: mp };
    });

    scored.sort((a, b) => b._signal - a._signal);

    const shortlisted: MentorCandidate[] = scored
      .slice(0, MENTORSHIP_AI_SHORTLIST_SIZE)
      .map(({ _signal: _, ...c }) => c as MentorCandidate);

    if (shortlisted.length < MENTORSHIP_MIN_CANDIDATES_FOR_AI) {
      // Not enough candidates — skip AI, use rule-based directly
      logger.info('MentorshipService', `Only ${shortlisted.length} candidates — skipping AI, using rule-based`);
      const ranked: RankedMentor[] = shortlisted.map((c) => ({
        ...c,
        ...runRuleBasedEngine(learner, learnerPrefs, c),
      }));
      ranked.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
      return { data: ranked, error: null };
    }

    // ── Step 4: AI analysis ───────────────────────────────────────────────
    const compatibilityMap = await analyzeCompatibilityWithAI(learner, learnerPrefs, shortlisted);

    // ── Step 5: Build ranked list ─────────────────────────────────────────
    const ranked: RankedMentor[] = shortlisted.map((c) => {
      const aiResult = compatibilityMap.get(c.user_id)
        ?? runRuleBasedEngine(learner, learnerPrefs, c); // per-candidate fallback

      return { ...c, compatibilityScore: aiResult.compatibilityScore, reasons: aiResult.reasons };
    });

    ranked.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    logger.info('MentorshipService', `Returning ${ranked.length} ranked mentors`);
    return { data: ranked, error: null };
  },

  // ── Mentor profile page ─────────────────────────────────────────────────

  async getMentorProfile(mentorUserId: string): Promise<MentorshipServiceResult<MentorCandidate & { mentor_preferences: MentorPreferences | null }>> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        user_id, full_name, age, qualification, qualification_other,
        specialization, occupation, occupation_other, experience,
        job_title, company, industry, state, city, bio, avatar_url,
        college_name, school_name
      `)
      .eq('user_id', mentorUserId)
      .eq('role', 'mentor')
      .single();

    if (error) return { data: null, error: parseError(error) };

    const prefsRes = await MentorshipService.getMentorPreferences(mentorUserId);

    return {
      data: { ...(data as MentorCandidate), mentor_preferences: prefsRes.data ?? null },
      error: null,
    };
  },

  // ── Mentorship request workflow ─────────────────────────────────────────

  async sendRequest(
    mentorId: string,
    learnerId: string,
    message?: string,
  ): Promise<MentorshipServiceResult<MentorshipRequest>> {
    // Prevent duplicate requests
    const { data: existing } = await supabase
      .from('mentorship_requests')
      .select('id, status')
      .eq('mentor_id', mentorId)
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (existing) {
      const status = (existing as { status: string }).status;
      if (status === 'pending') return { data: null, error: 'You already have a pending request with this mentor.' };
      if (status === 'accepted') return { data: null, error: 'You are already connected with this mentor.' };
    }

    const { data, error } = await supabase
      .from('mentorship_requests')
      .insert({
        mentor_id: mentorId,
        learner_id: learnerId,
        message: message ?? null,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };

    // Notification is handled by the DB trigger trg_notify_mentor_on_new_request
    // (SECURITY DEFINER — bypasses RLS so mentor receives it reliably)

    return { data: data as MentorshipRequest, error: null };
  },

  async updateRequestStatus(
    requestId: string,
    status: MentorshipRequestStatus,
    _actorUserId: string,
  ): Promise<MentorshipServiceResult<MentorshipRequest>> {
    const { data, error } = await supabase
      .from('mentorship_requests')
      .update({ status, responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    const req = data as MentorshipRequest;

    if (status === 'accepted') {
      const { error: connErr } = await supabase
        .from('mentorship_connections')
        .insert({
          request_id: requestId,
          mentor_id: req.mentor_id,
          learner_id: req.learner_id,
          status: 'active',
          connected_at: new Date().toISOString(),
        });

      if (connErr) logger.warn('MentorshipService', 'Failed to create connection record', connErr);

      // Notifications handled by DB trigger trg_notify_learner_on_request_update
      // (SECURITY DEFINER — bypasses RLS so learner receives them reliably)
    }

    if (status === 'rejected') {
      // Notification handled by DB trigger trg_notify_learner_on_request_update
    }

    return { data: req, error: null };
  },

  async getReceivedRequests(mentorId: string): Promise<MentorshipServiceResult<MentorshipRequestWithLearner[]>> {
    const { data: requests, error } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('requested_at', { ascending: false });

    if (error) return { data: null, error: parseError(error) };
    if (!requests || requests.length === 0) return { data: [], error: null };

    // Enrich with learner profiles
    const learnerIds = requests.map((r: { learner_id: string }) => r.learner_id);
    const { data: learnerProfiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, qualification, qualification_other, specialization, occupation, experience, state, city, bio, avatar_url, age, company, job_title, college_name, school_name')
      .in('user_id', learnerIds);

    const learnerMap = new Map<string, object>();
    for (const lp of (learnerProfiles ?? [])) {
      learnerMap.set((lp as { user_id: string }).user_id, lp);
    }

    const enriched: MentorshipRequestWithLearner[] = requests.map((r: MentorshipRequest) => ({
      ...r,
      learner: (learnerMap.get(r.learner_id) as MentorshipRequestWithLearner['learner']) ?? null,
    }));

    return { data: enriched, error: null };
  },

  async getSentRequests(learnerId: string): Promise<MentorshipServiceResult<MentorshipRequest[]>> {
    const { data, error } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('learner_id', learnerId)
      .order('requested_at', { ascending: false });

    if (error) return { data: null, error: parseError(error) };
    return { data: data as MentorshipRequest[], error: null };
  },

  async getExistingRequest(
    mentorId: string,
    learnerId: string,
  ): Promise<MentorshipServiceResult<MentorshipRequest>> {
    const { data, error } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('mentor_id', mentorId)
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as MentorshipRequest | null, error: null };
  },

  async getConnections(userId: string): Promise<MentorshipServiceResult<MentorshipConnection[]>> {
    const { data, error } = await supabase
      .from('mentorship_connections')
      .select('*')
      .or(`mentor_id.eq.${userId},learner_id.eq.${userId}`)
      .eq('status', 'active')
      .order('connected_at', { ascending: false });

    if (error) return { data: null, error: parseError(error) };
    return { data: data as MentorshipConnection[], error: null };
  },

  async getActiveRequestsForMentor(mentorId: string): Promise<MentorshipServiceResult<number>> {
    const { count, error } = await supabase
      .from('mentorship_connections')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', mentorId)
      .eq('status', 'active');

    if (error) return { data: null, error: parseError(error) };
    return { data: count ?? 0, error: null };
  },
};

export default MentorshipService;
