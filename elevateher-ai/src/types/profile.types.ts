// Profile and user related types

export type UserRole = 'learner' | 'mentor';

export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'other';

export type Qualification =
  | 'class_10'
  | 'class_12'
  | 'diploma'
  | 'iti'
  | 'ba'
  | 'bsc'
  | 'bcom'
  | 'bba'
  | 'bca'
  | 'btech'
  | 'be'
  | 'mbbs'
  | 'bds'
  | 'bpharm'
  | 'llb'
  | 'mba'
  | 'mca'
  | 'mtech'
  | 'msc'
  | 'ma'
  | 'mcom'
  | 'phd'
  | 'other';

export type Occupation =
  | 'student'
  | 'working_professional'
  | 'entrepreneur'
  | 'government_employee'
  | 'private_employee'
  | 'research_scholar'
  | 'freelancer'
  | 'homemaker'
  | 'job_seeker'
  | 'other';

export type EmploymentType =
  | 'government'
  | 'private'
  | 'startup'
  | 'self_employed'
  | 'ngo'
  | 'freelancer'
  | 'other';

export type AnnualIncome =
  | 'below_2l'
  | '2l_5l'
  | '5l_8l'
  | '8l_12l'
  | '12l_20l'
  | 'above_20l';

export type Category = 'general' | 'obc' | 'sc' | 'st' | 'ews' | 'prefer_not_to_say';

export type PwdStatus = 'yes' | 'no';

// profiles table
export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  age?: number | null;
  gender?: Gender | null;
  qualification?: Qualification | null;
  qualification_other?: string | null;
  specialization?: string | null;
  specialization_other?: string | null;
  occupation?: Occupation | null;
  occupation_other?: string | null;
  experience?: number | null;
  job_title?: string | null;
  company?: string | null;
  industry?: string | null;
  employment_type?: EmploymentType | null;
  annual_income?: AnnualIncome | null;
  category?: Category | null;
  pwd_status?: PwdStatus | null;
  state?: string | null;
  city?: string | null;
  bio?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

// Public-facing profile (excludes sensitive fields)
export interface PublicProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  qualification?: Qualification | null;
  qualification_other?: string | null;
  specialization?: string | null;
  occupation?: Occupation | null;
  experience?: number | null;
  state?: string | null;
  city?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

// Profile form steps
export interface ProfileStep1 {
  full_name: string;
  age?: number | null;
  gender?: Gender | null;
}

export interface ProfileStep2 {
  qualification: Qualification;
  qualification_other?: string;
  specialization?: string;
  specialization_other?: string;
}

export interface ProfileStep3 {
  occupation: Occupation;
  occupation_other?: string;
  experience?: number | null;
  job_title?: string | null;
  company?: string | null;
  industry?: string | null;
  employment_type?: EmploymentType | null;
}

export interface ProfileStep4 {
  annual_income: AnnualIncome;
  category: Category;
  pwd_status: PwdStatus;
  state: string;
  city: string;
}

export interface ProfileStep5 {
  bio: string;
}

export type ProfileFormData = ProfileStep1 &
  ProfileStep2 &
  ProfileStep3 &
  ProfileStep4 &
  ProfileStep5;
