// LoanService — Education Loan Finder business logic
//
// Responsibilities:
//   1. Build the optimised search query for education loans
//   2. Assemble the SearchRequest with loan-specific featureInput
//   3. Delegate to SearchService.search() — never calls Tavily or Gemini directly
//   4. Persist search history to Supabase
//   5. Save / unsave loans using the shared saved_items table
//
// ⚠️  Do NOT import TavilyService, GeminiService, PromptBuilder, or ResponseFormatter
//     directly from this file. All AI work goes through SearchService.

import { supabase } from './supabase/client';
import SearchService from './search/searchService';
import SavedItemsService from './SavedItemsService';
import type { UserProfileForSearch, SearchResponse } from '../types/ai.types';
import type {
  LoanFormData,
  EducationLoanRecommendation,
  SavedLoanMetadata,
  LoanSearchHistoryFilters,
} from '../types/educationLoan';
import { parseError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { PREFERRED_DOMAINS } from '../types/search.types';

// Preferred domains for education loan search — official bank + govt portals
const LOAN_PREFERRED_DOMAINS: string[] = [
  ...(PREFERRED_DOMAINS['education_loan'] ?? []),
  'education.gov.in',
  'indianbank.in',
  'pnbindia.in',
  'canarabank.com',
  'unionbankofindia.co.in',
  'bankofbaroda.in',
  'sbi.co.in',
  'axisbank.com',
  'hdfcbank.com',
  'icicibank.com',
  'myscheme.gov.in',
];

export interface LoanServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert form loan amount to a human-readable string for the AI prompt. */
function formatLoanAmount(amount: number | ''): string {
  if (!amount) return 'Not specified';
  if (amount >= 100) return `₹${amount} Lakh`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Build the feature-specific input record that PromptBuilder.build() and
 * PromptBuilder.buildSearchQuery() consume for the 'education_loan' type.
 */
function buildFeatureInput(
  form: LoanFormData,
  profile: UserProfileForSearch,
): Record<string, unknown> {
  const course =
    form.course === 'Other' && form.courseOther.trim()
      ? form.courseOther.trim()
      : form.course || profile.qualification || 'Not specified';

  const studyDestination =
    form.studyDestination === 'Abroad' && form.abroadCountry
      ? `Abroad (${form.abroadCountry})`
      : form.studyDestination || 'India';

  return {
    // Core academic fields used in PromptBuilder.buildFeatureTask('education_loan')
    course,
    institution: form.collegeName.trim() || undefined,
    loanAmount: formatLoanAmount(form.loanAmountRequired),

    // Extended context for richer Gemini prompting
    studyLevel: form.studyLevel || undefined,
    admissionStatus: form.admissionStatus || undefined,
    studyDestination,
    estimatedCost: form.estimatedCost || undefined,
    repaymentPreference: form.repaymentPreference || undefined,
    collateralAvailable: form.collateralAvailable || undefined,
    coapplicant: form.coapplicant || undefined,
    needMoratorium: form.needMoratorium,
    needFemaleBenefits: form.needFemaleBenefits,
    preferredBankType: form.preferredBankType || 'Any',
    interestRatePreference: form.interestRatePreference || 'No Preference',
    needGovernmentLoan: form.needGovernmentLoan,

    // Additional profile-derived context
    applicantCategory: profile.category ?? 'Not specified',
    applicantState: profile.state ?? 'India',
    familyIncome: profile.annual_income ?? 'Not specified',
    pwdStatus: profile.pwd_status === 'yes' ? 'Yes' : 'No',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LoanService
// ─────────────────────────────────────────────────────────────────────────────

const LoanService = {
  /**
   * Main entry point.
   * Calls SearchService with type 'education_loan' and loan-specific inputs.
   * Returns a SearchResponse containing EducationLoanRecommendation items.
   */
  async findLoans(
    form: LoanFormData,
    profile: UserProfileForSearch,
  ): Promise<SearchResponse<EducationLoanRecommendation>> {
    logger.info('LoanService', 'Starting education loan search');

    const featureInput = buildFeatureInput(form, profile);

    const response = await SearchService.search<EducationLoanRecommendation>({
      type: 'education_loan',
      profile,
      featureInput,
      preferredDomains: LOAN_PREFERRED_DOMAINS,
      maxResults: 8,
      searchDepth: 'advanced',
    });

    // Hydrate each recommendation with structured metadata fields so the UI
    // can access them directly without digging into the opaque metadata bag.
    if (response.results.length > 0) {
      response.results = response.results.map((rec) => ({
        ...rec,
        bankName: LoanService.extractField(rec.metadata, 'bank', rec.bankName),
        loanSchemeName: LoanService.extractField(rec.metadata, 'loanSchemeName', rec.loanSchemeName ?? rec.title),
        processingFee: LoanService.extractField(rec.metadata, 'processingFee', rec.processingFee),
        moratoriumPeriod: LoanService.extractField(rec.metadata, 'moratoriumPeriod', rec.moratoriumPeriod),
        collateralRequirement: LoanService.extractField(rec.metadata, 'collateralRequirement', rec.collateralRequirement),
        coapplicantRequirement: LoanService.extractField(rec.metadata, 'coapplicantRequirement', rec.coapplicantRequirement),
        femaleApplicantBenefits: LoanService.extractField(rec.metadata, 'femaleApplicantBenefits', rec.femaleApplicantBenefits),
        governmentSubsidy: LoanService.extractField(rec.metadata, 'governmentSubsidy', rec.governmentSubsidy),
        eligibilitySummary: LoanService.extractField(rec.metadata, 'eligibilitySummary', rec.eligibilitySummary),
        requiredDocuments: LoanService.extractDocuments(rec.metadata),
        applyNowLink: LoanService.extractField(rec.metadata, 'applyNowLink', rec.applicationLink ?? rec.applyNowLink),
        // Ensure top-level typed fields are also populated from metadata
        interestRate: rec.interestRate ?? LoanService.extractField(rec.metadata, 'interestRate'),
        maxAmount: rec.maxAmount ?? LoanService.extractField(rec.metadata, 'maxAmount'),
        repaymentPeriod: rec.repaymentPeriod ?? LoanService.extractField(rec.metadata, 'repaymentPeriod'),
        bank: rec.bank ?? LoanService.extractField(rec.metadata, 'bank'),
      }));
    }

    logger.info('LoanService', `Search complete — ${response.results.length} loans found`);
    return response;
  },

  // ── Search history ──────────────────────────────────────────────────────────

  async saveSearchHistory(
    userId: string,
    form: LoanFormData,
    resultsCount: number,
  ): Promise<void> {
    const course =
      form.course === 'Other' && form.courseOther.trim()
        ? form.courseOther.trim()
        : form.course || 'Not specified';

    const filters: LoanSearchHistoryFilters = {
      course,
      courseOther: form.courseOther || undefined,
      studyLevel: form.studyLevel || undefined,
      collegeName: form.collegeName.trim() || undefined,
      admissionStatus: form.admissionStatus || undefined,
      studyDestination: form.studyDestination || 'India',
      abroadCountry: form.abroadCountry || undefined,
      estimatedCost: form.estimatedCost || undefined,
      loanAmount: form.loanAmountRequired || 'Not specified',
      repaymentPreference: form.repaymentPreference || undefined,
      collateralAvailable: form.collateralAvailable || undefined,
      coapplicant: form.coapplicant || undefined,
      needMoratorium: form.needMoratorium,
      needFemaleBenefits: form.needFemaleBenefits,
      preferredBankType: form.preferredBankType || 'Any',
      interestRatePreference: form.interestRatePreference || undefined,
      needGovernmentLoan: form.needGovernmentLoan,
    };

    const query = [
      `Education loan for ${course}`,
      form.collegeName ? `at ${form.collegeName}` : '',
      form.studyDestination === 'Abroad' && form.abroadCountry ? `(${form.abroadCountry})` : '',
      form.loanAmountRequired ? `₹${form.loanAmountRequired}L` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const { error } = await supabase.from('search_history').insert({
      user_id: userId,
      query,
      category: 'loan',
      filters,
      results_count: resultsCount,
    });

    if (error) {
      logger.warn('LoanService', 'Failed to save search history', error);
    }
  },

  // ── Save / unsave ───────────────────────────────────────────────────────────

  async saveLoan(
    userId: string,
    loan: EducationLoanRecommendation,
  ): Promise<LoanServiceResult> {
    const itemId = LoanService.buildItemId(loan);
    const res = await SavedItemsService.save({
      userId,
      itemType: 'loan',
      itemId,
      itemTitle: loan.loanSchemeName ?? loan.title,
      itemMetadata: {
        bankName: loan.bankName ?? loan.bank ?? loan.title,
        interestRate: loan.interestRate,
        maxAmount: loan.maxAmount,
        repaymentPeriod: loan.repaymentPeriod,
        officialWebsite: loan.officialWebsite ?? undefined,
        savedAt: new Date().toISOString(),
      },
      snapshot: loan as unknown as Record<string, unknown>,
    });
    if (res.error) return { data: null, error: res.error };
    return { data: null, error: null };
  },

  async unsaveLoan(userId: string, loan: EducationLoanRecommendation): Promise<LoanServiceResult> {
    const itemId = LoanService.buildItemId(loan);
    const res = await SavedItemsService.unsave(userId, 'loan', itemId);
    if (res.error) return { data: null, error: res.error };
    return { data: null, error: null };
  },

  async getSavedLoanIds(userId: string): Promise<Set<string>> {
    return SavedItemsService.getSavedIds(userId, 'loan');
  },

  // ── Utilities ───────────────────────────────────────────────────────────────

  /** Build a stable, deduplication-safe ID from a loan recommendation. */
  buildItemId(loan: EducationLoanRecommendation): string {
    const base = `${loan.loanSchemeName ?? loan.title}-${loan.bankName ?? loan.bank ?? ''}`;
    return base
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 80);
  },

  /** Safely extract a string field from the opaque metadata bag. */
  extractField(
    metadata: Record<string, unknown>,
    key: string,
    fallback?: string,
  ): string | undefined {
    const val = metadata?.[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
    return fallback ?? undefined;
  },

  /** Safely extract required documents array from metadata. */
  extractDocuments(metadata: Record<string, unknown>): string[] | undefined {
    const docs = metadata?.['requiredDocuments'];
    if (Array.isArray(docs)) {
      return docs.filter((d): d is string => typeof d === 'string');
    }
    return undefined;
  },

  /** Validate the form before triggering an AI search. */
  validateForm(form: LoanFormData): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!form.course) errors.course = 'Please select a course.';
    if (form.course === 'Other' && !form.courseOther.trim()) {
      errors.course = 'Please specify the course name.';
    }
    if (!form.studyLevel) errors.studyLevel = 'Please select a study level.';
    if (!form.studyDestination) errors.studyDestination = 'Please select a study destination.';
    if (!form.estimatedCost) errors.estimatedCost = 'Please select the estimated education cost.';

    if (form.loanAmountRequired !== '') {
      const amount = Number(form.loanAmountRequired);
      if (isNaN(amount) || amount <= 0) {
        errors.loanAmountRequired = 'Please enter a valid loan amount (in Lakhs).';
      } else if (amount > 5000) {
        errors.loanAmountRequired = 'Loan amount seems too high. Please enter the amount in Lakhs.';
      }
    }

    if (!form.collateralAvailable) {
      errors.collateralAvailable = 'Please indicate collateral availability.';
    }
    if (!form.coapplicant) {
      errors.coapplicant = 'Please select a co-applicant type.';
    }

    return errors;
  },
};

export default LoanService;
