// notifications table
export type NotificationType =
  | 'mentorship_request'
  | 'mentorship_accepted'
  | 'mentorship_rejected'
  | 'mentorship_connection'
  | 'system'
  | 'general';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  related_id?: string | null;
  related_type?: string | null;
  created_at: string;
}
