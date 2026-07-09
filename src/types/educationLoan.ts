// Education Loan Finder — domain types
// All AI recommendation types extend the shared Recommendation interface from ai.types.

import type { LoanRecommendation } from './ai.types';

// ── Form input types ──────────────────────────────────────────────────────────

export type CourseType =
  | 'BTech'
  | 'MBBS'
  | 'BDS'
  | 'BCA'
  | 'BBA'
  | 'BCom'
  | 'BA'
  | 'BSc'
  | 'MSc'
  | 'MBA'
  | 'MTech'
  | 'LLB'
  | 'Diploma'
  | 'PhD'
  | 'Other';

export type StudyLevel = 'Undergraduate' | 'Postgraduate' | 'Doctorate' | 'Diploma';

export type AdmissionStatus =
  | 'Already Admitted'
  | 'Admission Offer Received'
  | 'Applying'
  | 'Yet to Apply';

export type StudyDestination = 'India' | 'Abroad';

export type AbroadCountry =
  | 'USA'
  | 'Canada'
  | 'UK'
  | 'Germany'
  | 'Australia'
  | 'Japan'
  | 'Singapore'
  | 'Other';

export type EducationCostRange =
  | 'Below ₹5 Lakh'
  | '₹5–10 Lakh'
  | '₹10–20 Lakh'
  | '₹20–50 Lakh'
  | 'Above ₹50 Lakh';

export type RepaymentPreference =
  | 'Lowest EMI'
  | 'Lowest Interest Rate'
  | 'Flexible Repayment'
  | 'Longer Tenure'
  | 'No Preference';

export type CollateralAvailability = 'Yes' | 'No' | 'Unsure';

export type CoapplicantType = 'Parent' | 'Guardian' | 'Spouse' | 'None';

export type PreferredBankType =
  | 'Public Sector Bank'
  | 'Private Bank'
  | 'NBFC'
  | 'Any';

export type InterestRatePreference =
  | 'Lowest Available'
  | 'Fixed Rate'
  | 'Floating Rate'
  | 'No Preference';

// ── Main form data ────────────────────────────────────────────────────────────

export interface LoanFormData {
  // Academic Details
  course: CourseType | '';
  courseOther: string;
  studyLevel: StudyLevel | '';
  collegeName: string;
  admissionStatus: AdmissionStatus | '';
  studyDestination: StudyDestination | '';
  abroadCountry: AbroadCountry | '';

  // Financial Details
  estimatedCost: EducationCostRange | '';
  loanAmountRequired: number | '';
  repaymentPreference: RepaymentPreference | '';
  collateralAvailable: CollateralAvailability | '';
  coapplicant: CoapplicantType | '';
  needMoratorium: boolean;
  needFemaleBenefits: boolean;

  // Loan Preferences
  preferredBankType: PreferredBankType | '';
  interestRatePreference: InterestRatePreference | '';
  needGovernmentLoan: boolean;
}

export const EMPTY_LOAN_FORM: LoanFormData = {
  course: '',
  courseOther: '',
  studyLevel: '',
  collegeName: '',
  admissionStatus: '',
  studyDestination: '',
  abroadCountry: '',
  estimatedCost: '',
  loanAmountRequired: '',
  repaymentPreference: '',
  collateralAvailable: '',
  coapplicant: '',
  needMoratorium: false,
  needFemaleBenefits: false,
  preferredBankType: '',
  interestRatePreference: '',
  needGovernmentLoan: false,
};

// ── Rich AI recommendation ────────────────────────────────────────────────────

// Extended loan recommendation with all fields Gemini is asked to return
export interface EducationLoanRecommendation extends LoanRecommendation {
  // Fields surfaced from metadata
  bankName?: string;
  loanSchemeName?: string;
  processingFee?: string;
  moratoriumPeriod?: string;
  collateralRequirement?: string;
  coapplicantRequirement?: string;
  femaleApplicantBenefits?: string;
  governmentSubsidy?: string;
  eligibilitySummary?: string;
  requiredDocuments?: string[];
  applyNowLink?: string;
}

// ── Saved loan shape stored in saved_items.item_metadata ─────────────────────

export interface SavedLoanMetadata {
  bankName: string;
  interestRate?: string;
  maxAmount?: string;
  repaymentPeriod?: string;
  officialWebsite?: string;
  savedAt: string;
}

// ── Search history filter shape stored in search_history.filters ─────────────

export interface LoanSearchHistoryFilters {
  course: string;
  loanAmount: number | string;
  studyDestination: string;
  preferredBankType: string;
  collegeName?: string;
}

// ── Loading step messages ─────────────────────────────────────────────────────

export const LOAN_LOADING_STEPS: string[] = [
  'Searching official bank websites...',
  'Finding eligible education loans...',
  'Comparing interest rates...',
  'Ranking recommendations...',
  'Preparing results...',
];

// ── Validation errors ─────────────────────────────────────────────────────────

export interface LoanFormErrors {
  course?: string;
  studyLevel?: string;
  studyDestination?: string;
  estimatedCost?: string;
  loanAmountRequired?: string;
  collateralAvailable?: string;
  coapplicant?: string;
  repaymentPreference?: string;
  preferredBankType?: string;
}
