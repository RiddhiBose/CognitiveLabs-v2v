// notifications table
export type NotificationType =
  | 'mentorship_request'
  | 'mentorship_accepted'
  | 'mentorship_rejected'
  | 'mentorship_connection'
  | 'mentor_match'
  | 'message_received'
  | 'unread_message'
  | 'welcome'
  | 'feature_announcement'
  | 'recommendation_update'
  | 'application_update'
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
  category?: string | null;
  source?: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  scholarship_updates: boolean;
  loan_updates: boolean;
  government_scheme_updates: boolean;
  financial_literacy_updates: boolean;
  mentorship_notifications: boolean;
  message_notifications: boolean;
  created_at?: string;
  updated_at?: string;
}

