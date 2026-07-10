// ─── Mentorship module types ───────────────────────────────────────────────

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

// mentorship_connections table
export type ConnectionStatus = 'active' | 'paused' | 'completed' | 'terminated';

export interface MentorshipConnection {
  id: string;
  request_id: string;
  mentor_id: string;
  learner_id: string;
  status: ConnectionStatus;
  chat_room_id?: string | null;
  next_session_at?: string | null;
  learning_roadmap?: Record<string, unknown> | null;
  mentor_rating?: number | null;
  mentor_review?: string | null;
  resources?: Record<string, unknown> | null;
  connected_at: string;
  ended_at?: string | null;
  created_at: string;
  updated_at: string;
}

// learner_preferences table
export interface LearnerPreferences {
  id: string;
  user_id: string;
  preferred_occupation: string | null;
  preferred_job_role: string | null;
  preferred_degree: string | null;
  preferred_branch: string | null;
  preferred_min_experience: number;
  created_at: string;
  updated_at: string;
}

export interface LearnerPreferencesInput {
  preferred_occupation: string;
  preferred_job_role: string;
  preferred_degree: string;
  preferred_branch: string;
  preferred_min_experience: number;
}

// mentor_preferences table
export interface MentorPreferences {
  id: string;
  user_id: string;
  preferred_learner_occupation: string | null;
  preferred_learner_age_min: number | null;
  preferred_learner_age_max: number | null;
  preferred_degree: string | null;
  preferred_branch: string | null;
  max_active_mentees: number;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface MentorPreferencesInput {
  preferred_learner_occupation: string;
  preferred_learner_age_min: number | null;
  preferred_learner_age_max: number | null;
  preferred_degree: string;
  preferred_branch: string;
  max_active_mentees: number;
  preferred_language: string;
}

// ─── Mentor candidate — profile rows joined for matching ──────────────────

export interface MentorCandidate {
  // From profiles table
  user_id: string;
  full_name: string;
  age?: number | null;
  qualification?: string | null;
  qualification_other?: string | null;
  specialization?: string | null;
  occupation?: string | null;
  occupation_other?: string | null;
  experience?: number | null;
  job_title?: string | null;
  company?: string | null;
  industry?: string | null;
  /** College or university attended — primary matching signal */
  college_name?: string | null;
  /** School attended — secondary matching signal */
  school_name?: string | null;
  state?: string | null;
  city?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  // From mentor_preferences (nullable — preferences may not be set yet)
  mentor_preferences?: MentorPreferences | null;
}

// ─── Ranked mentor — candidate + AI/rule-based scores ─────────────────────

export interface RankedMentor extends MentorCandidate {
  compatibilityScore: number;           // 0–100
  reasons: string[];                    // human-readable match reasons
  requestStatus?: MentorshipRequestStatus | null; // existing request state, if any
}

// ─── AI compatibility analysis output ─────────────────────────────────────
// This is what the AI providers (and rule-based fallback) MUST return.

export interface CompatibilityResult {
  compatibilityScore: number;
  reasons: string[];
}

// ─── Mentorship service result wrapper ────────────────────────────────────

export interface MentorshipServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

// ─── Request with learner profile attached (for mentor's inbox) ───────────

export interface MentorshipRequestWithLearner extends MentorshipRequest {
  learner?: {
    full_name: string;
    qualification?: string | null;
    qualification_other?: string | null;
    specialization?: string | null;
    occupation?: string | null;
    experience?: number | null;
    state?: string | null;
    city?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    age?: number | null;
    company?: string | null;
    job_title?: string | null;
  } | null;
}
