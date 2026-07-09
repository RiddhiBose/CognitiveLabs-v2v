import { supabase } from '../supabase/client';
import type { Notification, NotificationType } from '../../types';
import { parseError } from '../../utils/errorHandler';

export interface NotificationServiceResult<T = null> {
  data: T | null;
  error: string | null;
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
      .order('created_at', { ascending: false })
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
   * Create a notification for a user.
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'general',
    relatedId?: string,
    relatedType?: string,
  ): Promise<NotificationServiceResult<Notification>> {
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
      })
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as Notification, error: null };
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
   * Returns the subscription channel — caller must call .unsubscribe() on cleanup.
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
};

export default NotificationService;
