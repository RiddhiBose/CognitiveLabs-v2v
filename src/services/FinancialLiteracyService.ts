import { supabase } from './supabase/client';
import SearchService from './search/searchService';
import CacheService from './ai/cacheService';
import SavedItemsService from './SavedItemsService';
import type { FinancialLiteracyRecommendation } from '../types/ai.types';
import type {
  FinancialLiteracyFormValues,
  FinancialLiteracySearchRequest,
  FinancialLiteracySearchResponse,
} from '../types/financialLiteracy';

const PREFERRED_DOMAINS = [
  'swayam.gov.in',
  'nptel.ac.in',
  'coursera.org',
  'edx.org',
  'khanacademy.org',
  'nism.ac.in',
  'nseindia.com',
  'nseacademy.in',
  'rbi.org.in',
  'cfi.co',
  'cfainstitute.org',
  'investopedia.com',
  'futurelearn.com',
  'open.edu',
  'official university financial literacy programs',
];

function normalizeList(values: string[] | undefined | null): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(
    (item): item is string =>
      typeof item === 'string' && item.trim().length > 0 && item !== 'Any'
  );
}

function createSearchQuery(
  values: FinancialLiteracyFormValues,
  profile: FinancialLiteracySearchRequest['profile']
): string {
  const knowledgeLevel = values.knowledgeLevel && values.knowledgeLevel !== 'Any'
    ? values.knowledgeLevel.toLowerCase()
    : 'any level';
  const learningGoals = normalizeList(values.learningGoals);
  const courseLevel = values.courseLevel && values.courseLevel !== 'Any'
    ? values.courseLevel.toLowerCase()
    : 'any level';
  const courseFormats = normalizeList(values.courseFormat);
  const budget = values.budget || 'both';
  const certificatePreference = values.certificatePreference || 'no preference';
  const language = values.language || 'any';
  const platformPreference = normalizeList(values.platformPreference);

  const qualification = profile.qualification?.trim()?.toLowerCase() || 'professional';
  const occupation = profile.occupation?.trim()?.toLowerCase() || '';
  const state = profile.state?.trim() || '';

  const goalPhrase = learningGoals.length > 0
    ? learningGoals.join(' ').toLowerCase()
    : 'financial literacy';

  const formatPhrase = courseFormats.length > 0
    ? courseFormats.join(' ').toLowerCase()
    : 'any format';

  const platformPhrase = platformPreference.length > 0
    ? platformPreference.join(' ').toLowerCase()
    : 'all platforms';

  const certificatePhrase = certificatePreference.includes('Required')
    ? 'with certificate'
    : certificatePreference.includes('Optional')
      ? 'with optional certificate'
      : '';

  const budgetPhrase = budget === 'free'
    ? 'free courses'
    : budget === 'paid'
      ? 'paid courses'
      : 'free and paid courses';

  const languagePhrase = language && language !== 'any'
    ? `in ${language}`
    : 'in English and Indian languages';

  const parts = [
    `${knowledgeLevel} financial literacy courses`,
    `for ${goalPhrase}`,
    `at ${courseLevel} level`,
    `${formatPhrase} format`,
    budgetPhrase,
    certificatePhrase,
    `on ${platformPhrase}`,
    languagePhrase,
    `for ${occupation || qualification} professionals`,
    state ? `in ${state}` : '',
    'from official providers official websites verified sources',
    '2024 2025 2026',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return parts;
}

function normalizeError(error: string | null | undefined): string | null {
  if (!error) return null;
  const message = error.toLowerCase();

  if (
    message.includes('unauthorized') ||
    message.includes('invalid api key') ||
    message.includes('invalid key') ||
    message.includes('missing or invalid api key') ||
    message.includes('api key') ||
    message.includes('forbidden')
  ) {
    return 'Financial literacy course search is currently unavailable because the live AI credentials are invalid or unauthorized. Please update the API keys in your environment and try again.';
  }

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('connection')
  ) {
    return 'We could not reach the live course sources. Please check your internet connection and try again.';
  }

  if (
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('quota')
  ) {
    return 'The course search service is busy right now. Please wait a moment and try again.';
  }

  if (message.includes('timeout')) {
    return 'The search timed out. Please try again with a simpler query.';
  }

  return error;
}

const FinancialLiteracyService = {
  validateForm(_values: FinancialLiteracyFormValues): string | null {
    return null;
  },

  buildFeatureInput(
    values: FinancialLiteracyFormValues,
    profile: FinancialLiteracySearchRequest['profile']
  ): Record<string, unknown> {
    const learningGoals = normalizeList(values.learningGoals);
    const courseFormats = normalizeList(values.courseFormat);
    const platformPreference = normalizeList(values.platformPreference);

    return {
      knowledgeLevel: values.knowledgeLevel,
      learningGoals: learningGoals.length > 0 ? learningGoals : ['Any'],
      courseLevel: values.courseLevel,
      courseFormat: courseFormats.length > 0 ? courseFormats : ['Any'],
      budget: values.budget,
      certificatePreference: values.certificatePreference,
      language: values.language,
      platformPreference: platformPreference.length > 0 ? platformPreference : ['Any'],
      userQualification: profile.qualification ?? null,
      userSpecialization: profile.specialization ?? null,
      userOccupation: profile.occupation ?? null,
      userExperience: profile.experience ?? null,
      userState: profile.state ?? null,
      eligibilityContext: {
        currentQualification: profile.qualification ?? null,
        currentOccupation: profile.occupation ?? null,
        experience: profile.experience ?? null,
        annualIncome: profile.annual_income ?? null,
        state: profile.state ?? null,
      },
    };
  },

  async searchCourses(
    request: FinancialLiteracySearchRequest
  ): Promise<FinancialLiteracySearchResponse> {
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

    const serviceReady = SearchService.isReady();
    if (!serviceReady.ready) {
      return {
        results: [],
        error: 'Financial literacy course search is currently unavailable because the required AI services are not configured.',
        cached: false,
        searchDurationMs: 0,
        query: '',
        totalFound: 0,
      };
    }

    const profile = request.profile;
    const query = createSearchQuery(request.formValues, profile);

    const payload = {
      type: 'financial_literacy' as const,
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
      featureInput: this.buildFeatureInput(request.formValues, profile),
      preferredDomains: PREFERRED_DOMAINS,
      maxResults: 80,
      searchDepth: 'advanced' as const,
    };

    // Clear any cached financial literacy results to ensure the NISM URL fix takes effect
    CacheService.invalidateByType('financial_literacy');

    const response = await SearchService.search<FinancialLiteracyRecommendation>(payload);

    if (request.profile.user_id) {
      try {
        await supabase.from('search_history').insert({
          user_id: request.profile.user_id,
          query,
          category: 'financial-literacy',
          filters: {
            qualification: profile.qualification ?? null,
            occupation: profile.occupation ?? null,
            state: profile.state ?? null,
            experience: profile.experience ?? null,
            knowledgeLevel: request.formValues.knowledgeLevel,
            learningGoals: request.formValues.learningGoals,
            courseLevel: request.formValues.courseLevel,
            courseFormat: request.formValues.courseFormat,
            budget: request.formValues.budget,
            certificatePreference: request.formValues.certificatePreference,
            language: request.formValues.language,
            platformPreference: request.formValues.platformPreference,
          },
          results_count: response.totalFound,
        });
      } catch (historyError) {
        console.warn('FinancialLiteracyService', 'Failed to save search history', historyError);
      }
    }

    return {
      results: response.results as FinancialLiteracyRecommendation[],
      error: normalizeError(response.error),
      warning: response.warning ?? null,
      cached: response.cached,
      searchDurationMs: response.searchDurationMs,
      query: response.query || query,
      totalFound: response.totalFound,
    };
  },

  async saveCourse(
    userId: string,
    course: FinancialLiteracyRecommendation
  ): Promise<{ success: boolean; error: string | null }> {
    const itemId = `${course.title}-${course.provider ?? course.source}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const res = await SavedItemsService.save({
      userId,
      itemType: 'financial-literacy-course',
      itemId,
      itemTitle: course.title,
      itemMetadata: {
        provider: course.provider ?? null,
        topic: course.topic ?? null,
        level: course.level ?? null,
        duration: course.duration ?? null,
        isFree: course.isFree ?? null,
        officialWebsite: course.officialWebsite ?? null,
        enrollmentLink: course.applicationLink ?? null,
        sourceUrl: course.source ?? null,
      },
      snapshot: course as unknown as Record<string, unknown>,
    });

    if (res.error) return { success: false, error: res.error };
    return { success: true, error: null };
  },
};

export default FinancialLiteracyService;
