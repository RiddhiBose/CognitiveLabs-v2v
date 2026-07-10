import type { CollegeRecommendation } from './ai.types';

export interface AcademicDetails {
  class12Percentage: number;
  passingYear: number;
  board: string;
  course: string;
  specialization: string;
}

export interface ExamDetail {
  exam: string;
  rank: string;
  score: string;
  percentile: string;
}

export interface UserPreferences {
  preferredState: string;
  budget: string;
  collegeType: string;
  hostelRequired: 'yes' | 'no';
  girlsOnly: 'yes' | 'no';
  location: string;
}

export interface CollegeFinderFormData {
  // Academic
  class12Percentage: string;
  passingYear: string;
  board: string;
  course: string;
  specialization: string;

  // Exams
  selectedExams: string[];
  examsDetails: Record<string, ExamDetail>;

  // Preferences
  preferredState: string;
  budget: string;
  collegeType: string;
  hostelRequired: 'yes' | 'no';
  girlsOnly: 'yes' | 'no';
  location: string;

  // Missing profile info collected dynamically
  age?: string;
  state?: string;
  category?: string;
  annual_income?: string;
  pwd_status?: 'yes' | 'no';
}

export interface CollegeSearchFilters {
  academic: {
    percentage: number;
    year: number;
    board: string;
    course: string;
    specialization: string;
  };
  exams: ExamDetail[];
  preferences: UserPreferences;
  profile?: {
    age?: number;
    state?: string;
    category?: string;
    annual_income?: string;
    pwd_status?: string;
  };
}

export type { CollegeRecommendation };
