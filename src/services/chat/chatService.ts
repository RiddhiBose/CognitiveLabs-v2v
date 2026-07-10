/**
 * ChatService
 *
 * In-app messaging between mentor/mentee pairs.
 * Only users who share an active mentorship_connection may message each other.
 * Uses Supabase Realtime for live message delivery.
 */

import { supabase } from '../supabase/client';
import { parseError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import type { Message, ChatConnection } from '../../types';
import NotificationService from '../notification/notificationService';

export interface ChatServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

const ChatService = {
  /**
   * Fetch all active connections for a user, enriched with the other party's
   * profile and the last message + unread count — the chat inbox list.
   */
  async getConnections(userId: string): Promise<ChatServiceResult<ChatConnection[]>> {
    // Fetch active connections where the user is mentor or learner
    const { data: connections, error: connErr } = await supabase
      .from('mentorship_connections')
      .select('id, mentor_id, learner_id, status')
      .or(`mentor_id.eq.${userId},learner_id.eq.${userId}`)
      .eq('status', 'active')
      .order('connected_at', { ascending: false });

    if (connErr) return { data: null, error: parseError(connErr) };
    if (!connections || connections.length === 0) return { data: [], error: null };

    // Collect the other party's user_id for each connection
    type ConnRow = { id: string; mentor_id: string; learner_id: string; status: string };
    const otherIds = (connections as ConnRow[]).map((c) =>
      c.mentor_id === userId ? c.learner_id : c.mentor_id,
    );

    // Fetch profiles for all other parties in one query
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, role')
      .in('user_id', otherIds);

    const profileMap = new Map<string, { full_name: string; avatar_url: string | null; role: string }>();
    for (const p of profiles ?? []) {
      profileMap.set(
        (p as { user_id: string; full_name: string; avatar_url: string | null; role: string }).user_id,
        p as { full_name: string; avatar_url: string | null; role: string },
      );
    }

    // For each connection, fetch last message and unread count
    const enriched: ChatConnection[] = await Promise.all(
      (connections as ConnRow[]).map(async (conn) => {
        const otherId = conn.mentor_id === userId ? conn.learner_id : conn.mentor_id;
        const otherProfile = profileMap.get(otherId);

        // Last message
        const { data: lastMsgRows } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('connection_id', conn.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMsg = lastMsgRows?.[0] as { content: string; created_at: string } | undefined;

        // Unread count — messages sent TO this user that are unread
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('connection_id', conn.id)
          .eq('receiver_id', userId)
          .eq('is_read', false);

        return {
          connection_id: conn.id,
          other_user_id: otherId,
          other_user_name: otherProfile?.full_name ?? 'Unknown',
          other_user_avatar: otherProfile?.avatar_url ?? null,
          other_user_role: (otherProfile?.role ?? 'learner') as 'mentor' | 'learner',
          unread_count: unreadCount ?? 0,
          last_message: lastMsg?.content ?? null,
          last_message_at: lastMsg?.created_at ?? null,
        };
      }),
    );

    return { data: enriched, error: null };
  },

  /**
   * Fetch all messages for a connection, ordered oldest → newest.
   */
  async getMessages(connectionId: string): Promise<ChatServiceResult<Message[]>> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true });

    if (error) return { data: null, error: parseError(error) };
    return { data: data as Message[], error: null };
  },

  /**
   * Send a message. The RLS policy ensures the sender is part of an active connection.
   */
  async sendMessage(
    connectionId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<ChatServiceResult<Message>> {
    const trimmed = content.trim();
    if (!trimmed) return { data: null, error: 'Message cannot be empty.' };
    if (trimmed.length > 2000) return { data: null, error: 'Message is too long (max 2000 characters).' };

    const { data, error } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: trimmed,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('ChatService', 'sendMessage failed', error);
      return { data: null, error: parseError(error) };
    }

    // Send real-time notification to the receiver (fire-and-forget)
    (async () => {
      try {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', senderId)
          .single();
        const senderName = (senderProfile as { full_name?: string } | null)?.full_name ?? 'Someone';
        const truncatedContent = trimmed.length > 60 ? trimmed.slice(0, 57) + '...' : trimmed;

        await NotificationService.createNotification(
          receiverId,
          'New Message Received',
          `New message from ${senderName}: "${truncatedContent}"`,
          'message_received',
          connectionId,
          'chat',
          'messaging',
          senderName
        );
      } catch (err) {
        logger.warn('ChatService', 'Failed to generate message notification', err);
      }
    })();

    return { data: data as Message, error: null };
  },

  /**
   * Mark all unread messages in a connection as read for a given receiver.
   */
  async markConnectionRead(connectionId: string, receiverId: string): Promise<ChatServiceResult> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('connection_id', connectionId)
      .eq('receiver_id', receiverId)
      .eq('is_read', false);

    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  /**
   * Get the total unread message count across all connections for a user.
   */
  async getTotalUnreadCount(userId: string): Promise<ChatServiceResult<number>> {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) return { data: null, error: parseError(error) };
    return { data: count ?? 0, error: null };
  },

  /**
   * Subscribe to new messages for a specific connection.
   * Returns the Supabase channel — caller must call .unsubscribe() on cleanup.
   */
  subscribeToMessages(
    connectionId: string,
    onNew: (message: Message) => void,
  ) {
    return supabase
      .channel(`messages:${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => onNew(payload.new as Message),
      )
      .subscribe();
  },

  /**
   * Verify that two users share an active connection and return its id.
   * Returns null if no active connection exists.
   */
  async getConnectionId(
    userId: string,
    otherUserId: string,
  ): Promise<ChatServiceResult<string>> {
    const { data, error } = await supabase
      .from('mentorship_connections')
      .select('id')
      .or(
        `and(mentor_id.eq.${userId},learner_id.eq.${otherUserId}),` +
        `and(mentor_id.eq.${otherUserId},learner_id.eq.${userId})`,
      )
      .eq('status', 'active')
      .maybeSingle();

    if (error) return { data: null, error: parseError(error) };
    if (!data) return { data: null, error: 'No active connection found with this user.' };
    return { data: (data as { id: string }).id, error: null };
  },
};

export default ChatService;
