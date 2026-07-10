import type { Profile } from './profile.types';
import type { FinancialLiteracyRecommendation } from './ai.types';

export interface FinancialLiteracyFormValues {
  knowledgeLevel: string;
  learningGoals: string[];
  courseLevel: string;
  courseFormat: string[];
  budget: string;
  certificatePreference: string;
  language: string;
  platformPreference: string[];
}

export interface FinancialLiteracySearchRequest {
  profile: Profile;
  formValues: FinancialLiteracyFormValues;
}

export interface FinancialLiteracySearchResponse {
  results: FinancialLiteracyRecommendation[];
  error: string | null;
  warning?: string | null;
  cached: boolean;
  searchDurationMs: number;
  query: string;
  totalFound: number;
}

export const KNOWLEDGE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Any'] as const;

export const LEARNING_GOALS = [
  'Personal Finance',
  'Budgeting',
  'Saving',
  'Investing',
  'Stock Market',
  'Mutual Funds',
  'SIP',
  'Tax Planning',
  'Insurance',
  'Credit Score',
  'Loans',
  'Entrepreneurship Finance',
  'Business Finance',
  'Retirement Planning',
  'Financial Independence',
  'Women Financial Empowerment',
  'Banking Basics',
  'Cryptocurrency',
  'Any',
] as const;

export const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Any'] as const;

export const COURSE_FORMATS = [
  'Self-paced',
  'Instructor-led',
  'Live',
  'Recorded',
  'Any',
] as const;

export const BUDGET_OPTIONS = ['Free', 'Paid', 'Both'] as const;

export const CERTIFICATE_PREFERENCES = [
  'Certificate Required',
  'Certificate Optional',
  'No Preference',
] as const;

export const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Regional Languages',
  'Any',
] as const;

export const PLATFORM_PREFERENCES = [
  'Coursera',
  'edX',
  'NPTEL',
  'SWAYAM',
  'Khan Academy',
  'NSE Academy',
  'NISM',
  'RBI',
  'CFI',
  'Investopedia Academy',
  'Any',
] as const;

export const FINANCIAL_LITERACY_FORM_DEFAULTS: FinancialLiteracyFormValues = {
  knowledgeLevel: 'Any',
  learningGoals: ['Any'],
  courseLevel: 'Any',
  courseFormat: ['Any'],
  budget: 'Both',
  certificatePreference: 'No Preference',
  language: 'Any',
  platformPreference: ['Any'],
};
