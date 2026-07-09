// mentors table
export interface Mentor {
  id: string;
  user_id: string;
  experience: number;
  industry?: string | null;
  company?: string | null;
  bio?: string | null;
  availability?: string | null;
  skills?: string[] | null;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface MentorWithProfile extends Mentor {
  profile?: {
    full_name: string;
    state?: string | null;
    city?: string | null;
    avatar_url?: string | null;
  };
}
