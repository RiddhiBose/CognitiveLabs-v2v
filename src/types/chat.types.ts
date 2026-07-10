// messages table — in-app mentor/mentee chat

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// A connection enriched with the other party's profile, used by the chat UI
export interface ChatConnection {
  connection_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string | null;
  other_user_role: 'mentor' | 'learner';
  unread_count: number;
  last_message?: string | null;
  last_message_at?: string | null;
}
