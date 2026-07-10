// AI service types for Phase 2

export type FeatureType =
  | 'college'
  | 'scholarship'
  | 'education_loan'
  | 'startup_funding'
  | 'financial_literacy';

// ---------- Tavily ----------

export interface TavilySearchParams {
  query: string;
  preferredDomains?: string[];
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
  responseTime: number;
}

// ---------- Gemini ----------

export interface GeminiRequest {
  prompt: string;
  searchResults: TavilySearchResult[];
}

export interface GeminiRawResponse {
  text: string;
  modelUsed: string;
  promptTokens?: number;
  candidateTokens?: number;
}

// ---------- Recommendation ----------

export interface Recommendation {
  title: string;
  summary: string;
  matchScore: number;          // 0–100
  reason: string;
  officialWebsite?: string | null;
  applicationLink?: string | null;
  source: string;
  location?: string | null;
  metadata: Record<string, unknown>;
}

// Feature modules extend this for their own fields
export interface CollegeRecommendation extends Recommendation {
  courseName?: string;
  entranceExam?: string;
  fees?: string;
  ranking?: string;
  cutoff?: string;
  collegeType?: string;
  hostelAvailable?: boolean;
  girlsOnly?: boolean;
  locationType?: string;
  applicationSteps?: string;
  requiredDocuments?: string;
}

export interface ScholarshipRecommendation extends Recommendation {
  amount?: string;
  deadline?: string;
  eligibility?: string;
  provider?: string;
  applicationSteps?: string;
  requiredDocuments?: string;
}

export interface LoanRecommendation extends Recommendation {
  interestRate?: string;
  maxAmount?: string;
  repaymentPeriod?: string;
  bank?: string;
  applicationSteps?: string;
  requiredDocuments?: string;
}

export interface StartupFundingRecommendation extends Recommendation {
  // Core funding details
  fundingType?: string;
  organization?: string;
  maxAmount?: string;
  minAmount?: string;
  stage?: string;
  sector?: string;

  // Eligibility
  eligibility?: string;
  womenFounderPreference?: string;
  registrationRequired?: string;
  revenueStageRequired?: string;

  // Equity / terms
  equityRequirement?: string;

  // Application
  deadline?: string;
  applicationProcess?: string;
  requiredDocuments?: string;
  benefits?: string;

  // Contact / portals
  applicationPortal?: string;
  contactInfo?: string;

  // Source credibility
  sourceType?: string;   // 'Official' | 'Trusted Public Source'
}

export interface FinancialLiteracyRecommendation extends Recommendation {
  topic?: string;
  provider?: string;
  duration?: string;
  level?: string;
  isFree?: boolean;
}

// ---------- Search Request / Response ----------

export interface SearchRequest {
  type: FeatureType;
  profile: UserProfileForSearch;
  featureInput: Record<string, unknown>;
  preferredDomains: string[];
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
}

// Minimal profile shape needed by the AI engine (avoids importing full Profile)
export interface UserProfileForSearch {
  full_name: string;
  role: string;
  qualification?: string | null;
  qualification_other?: string | null;
  specialization?: string | null;
  occupation?: string | null;
  experience?: number | null;
  annual_income?: string | null;
  category?: string | null;
  pwd_status?: string | null;
  state?: string | null;
  city?: string | null;
  bio?: string | null;
  job_title?: string | null;
  industry?: string | null;
}

export interface SearchResponse<T extends Recommendation = Recommendation> {
  results: T[];
  query: string;
  featureType: FeatureType;
  totalFound: number;
  cached: boolean;
  searchDurationMs: number;
  error: string | null;
  warning?: string | null;
}

// ---------- Cache ----------

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;       // epoch ms
  expiresAt: number;      // epoch ms
  key: string;
}

// ---------- Prompt ----------

export interface PromptContext {
  featureType: FeatureType;
  profile: UserProfileForSearch;
  searchResults: TavilySearchResult[];
  featureInput: Record<string, unknown>;
}
