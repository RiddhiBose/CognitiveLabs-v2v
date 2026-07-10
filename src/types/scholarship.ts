import type { Profile } from './profile.types';
import type { ScholarshipRecommendation } from './ai.types';

export interface ScholarshipFormValues {
  currentCgpa: string;
  currentSemester: string;
  institutionName: string;
  targetEducationLevel: string;
  targetDegree: string;
  targetSpecialization: string;
  studyLocation: string;
  preferredCountry: string;
  scholarshipTypes: string[];
  fundingCoverage: string[];
  applicationStatus: string;
  maximumDistance: string;
}

export interface ScholarshipSearchRequest {
  profile: Profile;
  formValues: ScholarshipFormValues;
}

export interface ScholarshipSearchResponse {
  results: ScholarshipRecommendation[];
  error: string | null;
  warning?: string | null;
  cached: boolean;
  searchDurationMs: number;
  query: string;
  totalFound: number;
}

export const SCHOLARSHIP_EDUCATION_LEVELS = ['Undergraduate', 'Postgraduate', 'PhD', 'Diploma', 'Research', 'Any'] as const;
export const STUDY_LOCATION_OPTIONS = ['India', 'International', 'Both', 'Any'] as const;
export const SCHOLARSHIP_TYPES = ['Merit Based', 'Need Based', 'Minority', 'Women Empowerment', 'Research', 'Sports', 'Disability', 'Government', 'Private', 'NGO', 'International', 'Any'] as const;
export const FUNDING_COVERAGE_OPTIONS = ['Tuition Fee', 'Living Expenses', 'Full Scholarship', 'Partial Scholarship', 'Travel Grant', 'Any'] as const;
export const APPLICATION_STATUS_OPTIONS = ['Open Applications Only', 'Upcoming', 'All'] as const;
export const MAXIMUM_DISTANCE_OPTIONS = ['State Only', 'National', 'International', 'Any'] as const;

export const SCHOLARSHIP_FORM_DEFAULTS: ScholarshipFormValues = {
  currentCgpa: '',
  currentSemester: '',
  institutionName: '',
  targetEducationLevel: 'Any',
  targetDegree: '',
  targetSpecialization: '',
  studyLocation: 'Both',
  preferredCountry: '',
  scholarshipTypes: ['Any'],
  fundingCoverage: ['Any'],
  applicationStatus: 'Open Applications Only',
  maximumDistance: 'Any',
};
