// StartupFundingService — business logic for the Startup Funding Finder module.
// Responsibilities:
//   1. Validate form inputs
//   2. Build a feature-specific featureInput object
//   3. Generate an optimised search query (via PromptBuilder inside SearchService)
//   4. Call SearchService.search() — never calls Tavily or Gemini directly
//   5. Save search history to Supabase
//   6. Save / unsave opportunities in saved_items

import { supabase } from './supabase/client';
import SearchService from './search/searchService';
import type { StartupFundingRecommendation } from '../types/ai.types';
import { parseError } from '../utils/errorHandler';
import type {
  StartupFundingFormValues,
  StartupFundingSearchRequest,
  StartupFundingSearchResponse,
} from '../types/startupFunding';

// ── Preferred domains ─────────────────────────────────────────────────────────
// Official sources are listed first; trusted public sources follow.

const OFFICIAL_DOMAINS = [
  'startupindia.gov.in',
  'dpiit.gov.in',
  'investindia.gov.in',
  'msme.gov.in',
  'myscheme.gov.in',
  'sidbi.in',
  'dst.gov.in',
  'dbtindia.gov.in',
  'nsrcel.org',
  't-hub.co',
  'iima.org',
  'bii.in',
];

const TRUSTED_PUBLIC_DOMAINS = [
  'inc42.com',
  'yourstory.com',
  'techcrunch.com',
  'crunchbase.com',
  'ycombinator.com',
  'wellfound.com',
  'linkedin.com',
  'reddit.com',
  'quora.com',
];

const ALL_PREFERRED_DOMAINS = [...OFFICIAL_DOMAINS, ...TRUSTED_PUBLIC_DOMAINS];

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseError(error: string | null | undefined): string | null {
  if (!error) return null;
  const msg = error.toLowerCase();

  if (
    msg.includes('unauthorized') ||
    msg.includes('invalid api key') ||
    msg.includes('invalid key') ||
    msg.includes('api key') ||
    msg.includes('forbidden')
  ) {
    return 'Startup funding search is currently unavailable because the live AI credentials are invalid or unauthorised. Please update the API keys in your environment and try again.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('connection')) {
    return 'We could not reach the live funding sources. Please check your internet connection and try again.';
  }
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('quota')) {
    return 'The funding search service is busy right now. Please wait a moment and try again.';
  }
  if (msg.includes('timeout')) {
    return 'The search timed out. Please try again.';
  }
  return error;
}

// ── Service ───────────────────────────────────────────────────────────────────

const StartupFundingService = {
  // ── Validation ─────────────────────────────────────────────────────────────

  validateForm(values: StartupFundingFormValues): string | null {
    if (!values.startupName.trim()) return 'Please enter your startup name.';
    if (!values.startupIdea.trim()) return 'Please describe your startup idea.';
    if (!values.industry) return 'Please select your industry.';
    if (!values.startupStage) return 'Please select your startup stage.';
    if (!values.fundingRequired) return 'Please select the funding amount you need.';
    if (!values.businessModel) return 'Please select your business model.';
    if (!values.womenLed) return 'Please indicate whether this is a women-led startup.';
    if (!values.currentRevenue) return 'Please select your current revenue stage.';
    if (values.lookingFor.length === 0) return 'Please select at least one funding type you are looking for.';
    return null;
  },

  // ── Feature input builder ───────────────────────────────────────────────────
  // Packages all form + profile data into the generic featureInput Record
  // consumed by PromptBuilder and ultimately by the AI pipeline.

  buildFeatureInput(
    values: StartupFundingFormValues,
    profile: StartupFundingSearchRequest['profile'],
  ): Record<string, unknown> {
    return {
      // Startup-specific inputs
      startupName: values.startupName.trim(),
      startupIdea: values.startupIdea.trim(),
      sector: values.industry,
      industry: values.industry,
      startupStage: values.startupStage,
      stage: values.startupStage,           // alias for PromptBuilder compatibility
      fundingRequired: values.fundingRequired,
      businessModel: values.businessModel,
      startupRegistration: values.startupRegistration || 'Not specified',
      womenLed: values.womenLed,
      currentRevenue: values.currentRevenue,
      lookingFor: values.lookingFor,
      fundingType: values.lookingFor,       // alias for PromptBuilder compatibility
      preferredLocation: values.preferredLocation,
      additionalPreferences: values.additionalPreferences,

      // Founder context from profile (passed through so the prompt task can see it)
      founderName: profile.full_name ?? 'Not specified',
      founderState: profile.state ?? 'Not specified',
      founderCity: profile.city ?? 'Not specified',
      founderOccupation: profile.occupation ?? 'Not specified',
      founderExperience: profile.experience ?? null,
      founderIndustry: profile.industry ?? null,
      founderQualification: profile.qualification ?? null,
    };
  },

  // ── Main search ─────────────────────────────────────────────────────────────

  async searchFunding(
    request: StartupFundingSearchRequest,
  ): Promise<StartupFundingSearchResponse> {
    // 1. Validate inputs
    const validationError = this.validateForm(request.formValues);
    if (validationError) {
      return {
        results: [],
        error: validationError,
        cached: false,
        searchDurationMs: 0,
        query: '',
        totalFound: 0,
      };
    }

    // 2. Check AI services are configured
    const serviceReady = SearchService.isReady();
    if (!serviceReady.ready) {
      return {
        results: [],
        error:
          'Startup funding search is currently unavailable because the required AI services are not configured. Please add ' +
          serviceReady.missing.join(' and ') +
          ' to your environment.',
        cached: false,
        searchDurationMs: 0,
        query: '',
        totalFound: 0,
      };
    }

    const { profile, formValues } = request;

    // 3. Build feature-specific input
    const featureInput = this.buildFeatureInput(formValues, profile);

    // 4. Delegate entirely to SearchService — no direct Tavily / Gemini calls here
    const response = await SearchService.search<StartupFundingRecommendation>({
      type: 'startup_funding',
      profile: {
        full_name: profile.full_name ?? 'User',
        role: profile.role ?? 'learner',
        qualification: profile.qualification ?? null,
        qualification_other: profile.qualification_other ?? null,
        specialization: profile.specialization ?? null,
        occupation: profile.occupation ?? null,
        experience: profile.experience ?? null,
        annual_income: profile.annual_income ?? null,
        category: profile.category ?? null,
        pwd_status: profile.pwd_status ?? null,
        state: profile.state ?? null,
        city: profile.city ?? null,
        bio: profile.bio ?? null,
        job_title: profile.job_title ?? null,
        industry: profile.industry ?? null,
      },
      featureInput,
      preferredDomains: ALL_PREFERRED_DOMAINS,
      maxResults: 15,
      searchDepth: 'advanced',
    });

    // 5. Normalise error message (if any)
    const normalisedError = normaliseError(response.error);

    // 6. Save search history in background (non-blocking)
    if (profile.user_id && response.results.length > 0 && !response.cached) {
      this.saveSearchHistory(profile.user_id, response.query, formValues, response.results.length).catch(
        (err) => console.error('[StartupFundingService] Error saving search history:', err),
      );
    }

    return {
      results: response.results,
      error: normalisedError,
      warning: response.warning ?? null,
      cached: response.cached,
      searchDurationMs: response.searchDurationMs,
      query: response.query,
      totalFound: response.totalFound,
    };
  },

  // ── Search history ──────────────────────────────────────────────────────────

  async saveSearchHistory(
    userId: string,
    query: string,
    values: StartupFundingFormValues,
    resultsCount: number,
  ): Promise<void> {
    const { error } = await supabase.from('search_history').insert({
      user_id: userId,
      query,
      category: 'startup_funding',
      filters: {
        industry: values.industry,
        startupStage: values.startupStage,
        fundingRequired: values.fundingRequired,
        lookingFor: values.lookingFor,
        preferredLocation: values.preferredLocation,
        womenLed: values.womenLed,
        businessModel: values.businessModel,
        startupRegistration: values.startupRegistration,
        currentRevenue: values.currentRevenue,
        additionalPreferences: values.additionalPreferences,
      },
      results_count: resultsCount,
    });
    if (error) {
      console.error('[StartupFundingService] Failed to save search history:', parseError(error));
    }
  },

  // ── Save / unsave opportunity ───────────────────────────────────────────────

  async saveOpportunity(
    userId: string,
    opportunity: StartupFundingRecommendation,
  ): Promise<{ success: boolean; error?: string }> {
    const itemId = `${opportunity.title}-${opportunity.organization ?? opportunity.source ?? 'unknown'}`;

    const { error } = await supabase.from('saved_items').insert({
      user_id: userId,
      item_type: 'startup_funding',
      item_id: itemId,
      item_title: opportunity.title,
      item_metadata: {
        organization: opportunity.organization ?? null,
        fundingType: opportunity.fundingType ?? null,
        officialWebsite: opportunity.officialWebsite ?? null,
        applicationPortal: opportunity.applicationPortal ?? opportunity.applicationLink ?? null,
        maxAmount: opportunity.maxAmount ?? null,
        minAmount: opportunity.minAmount ?? null,
        stage: opportunity.stage ?? null,
        sector: opportunity.sector ?? null,
        deadline: opportunity.deadline ?? null,
        sourceType: opportunity.sourceType ?? null,
        source: opportunity.source ?? null,
        savedTime: new Date().toISOString(),
      },
    });

    if (error) {
      // Unique constraint violation means already saved — treat as success
      if (error.code === '23505') {
        return { success: true };
      }
      return { success: false, error: parseError(error) };
    }

    return { success: true };
  },

  async unsaveOpportunity(
    userId: string,
    opportunityTitle: string,
    organization: string | undefined,
  ): Promise<{ success: boolean; error?: string }> {
    const itemId = `${opportunityTitle}-${organization ?? 'unknown'}`;

    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('user_id', userId)
      .eq('item_type', 'startup_funding')
      .eq('item_id', itemId);

    if (error) {
      return { success: false, error: parseError(error) };
    }
    return { success: true };
  },

  async isOpportunitySaved(
    userId: string,
    opportunityTitle: string,
    organization: string | undefined,
  ): Promise<boolean> {
    const itemId = `${opportunityTitle}-${organization ?? 'unknown'}`;

    const { data, error } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', userId)
      .eq('item_type', 'startup_funding')
      .eq('item_id', itemId)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  },
};

export default StartupFundingService;
