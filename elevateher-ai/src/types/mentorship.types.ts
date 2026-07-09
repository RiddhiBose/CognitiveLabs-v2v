// mentorship_requests table
export type MentorshipRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface MentorshipRequest {
  id: string;
  mentor_id: string;
  learner_id: string;
  status: MentorshipRequestStatus;
  message?: string | null;
  requested_at: string;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}
