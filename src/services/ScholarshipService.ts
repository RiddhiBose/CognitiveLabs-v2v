import { supabase } from './supabase/client';
import SearchService from './search/searchService';
import SavedItemsService from './SavedItemsService';
import type { ScholarshipRecommendation } from '../types/ai.types';
import type { ScholarshipFormValues, ScholarshipSearchRequest, ScholarshipSearchResponse } from '../types/scholarship';

const PREFERRED_DOMAINS = [
  'scholarships.gov.in',
  'nationalscholarship.gov.in',
  'ugc.gov.in',
  'aicte-india.org',
  'education.gov.in',
  'official state scholarship portals',
  'official university scholarship pages',
  'official government scholarship portals',
  'official ngo scholarship websites',
  'official corporate csr scholarship portals',
];

const INTERNATIONAL_PREFERRED_DOMAINS = [
  'mext.go.jp',
  'studyinjapan.go.jp',
  'daad.de',
  'chevening.org',
  'erasmus-plus.ec.europa.eu',
  'commonwealthscholarships.org',
  'foreign.fulbrightonline.org',
  'studyinkorea.go.kr',
  'campuschina.org',
  'education.gov.au',
  'official university scholarship pages',
];

function normalizeList(values: string[] | undefined | null): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((item): item is string => typeof item === 'string' && item.trim().length > 0 && item !== 'Any');
}

function inferNationality(profile: ScholarshipSearchRequest['profile']): string {
  const country = (profile as ScholarshipSearchRequest['profile'] & { country?: string | null }).country;
  return country?.trim() || 'Indian';
}

function inferCourse(profile: ScholarshipSearchRequest['profile'], values: ScholarshipFormValues): string {
  return profile.specialization?.trim() || profile.qualification?.trim() || values.institutionName?.trim() || 'engineering';
}

function getStudyLocation(values: ScholarshipFormValues): 'international' | 'india' | 'both' {
  const normalized = values.studyLocation?.trim().toLowerCase();
  if (!normalized || normalized === 'any' || normalized === 'both') {
    return 'both';
  }

  if (normalized === 'international') {
    return 'international';
  }

  return 'india';
}

function getScopePreference(values: ScholarshipFormValues): 'international' | 'india' | 'both' {
  return getStudyLocation(values);
}

function createSearchQuery(values: ScholarshipFormValues, profile: ScholarshipSearchRequest['profile']): string {
  const scope = getScopePreference(values);
  const types = normalizeList(values.scholarshipTypes);
  const fundingCoverage = normalizeList(values.fundingCoverage);
  const targetLevel = values.targetEducationLevel && values.targetEducationLevel !== 'Any' ? values.targetEducationLevel.toLowerCase() : 'scholarships';
  const targetDegree = values.targetDegree?.trim();
  const targetSpecialization = values.targetSpecialization?.trim();
  const preferredCountry = values.preferredCountry?.trim();
  const course = inferCourse(profile, values).toLowerCase();
  const nationality = inferNationality(profile).toLowerCase();
  const statusPhrase = values.applicationStatus === 'Open Applications Only'
    ? 'currently open'
    : values.applicationStatus === 'Upcoming'
      ? 'upcoming'
      : 'currently open and upcoming';
  const scopePhrase = scope === 'international'
    ? 'international'
    : scope === 'both'
      ? 'india and international'
      : 'indian';
  const degreePhrase = targetDegree || targetSpecialization
    ? `${(targetDegree || targetSpecialization || course).toLowerCase()}`
    : course;
  const typePhrase = types.length > 0 ? types.join(' ').toLowerCase() : 'all scholarship types';
  const fundingPhrase = fundingCoverage.length > 0 ? fundingCoverage.join(' ').toLowerCase() : 'all funding options';
  const countryPhrase = preferredCountry && preferredCountry.toLowerCase() !== 'any' ? `in ${preferredCountry}` : '';
  const incomePhrase = profile.annual_income?.includes('below') || profile.annual_income?.includes('2l') ? 'low income' : '';
  const categoryPhrase = profile.category && profile.category !== 'prefer_not_to_say' ? profile.category.toLowerCase() : '';
  const pwdPhrase = profile.pwd_status === 'yes' ? 'pwd' : '';
  const genderPhrase = profile.gender && profile.gender !== 'prefer_not_to_say' ? profile.gender.toLowerCase() : '';

  const parts = [
    statusPhrase,
    scopePhrase,
    targetLevel,
    'scholarships',
    typePhrase,
    fundingPhrase,
    degreePhrase ? `for ${nationality} ${degreePhrase} students` : `for ${nationality} students`,
    countryPhrase,
    categoryPhrase,
    incomePhrase,
    genderPhrase,
    pwdPhrase,
    'official websites university portals government portals',
    '2024 2025',
  ].filter(Boolean);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function buildPreferredDomains(values: ScholarshipFormValues): string[] {
  const scope = getScopePreference(values);
  if (scope === 'international') {
    return Array.from(new Set([...INTERNATIONAL_PREFERRED_DOMAINS, ...PREFERRED_DOMAINS]));
  }

  if (scope === 'both') {
    return Array.from(new Set([...PREFERRED_DOMAINS, ...INTERNATIONAL_PREFERRED_DOMAINS]));
  }

  return PREFERRED_DOMAINS;
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
    return 'Scholarship search is currently unavailable because the live AI credentials are invalid or unauthorized. Please update the API keys in your environment and try again.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch') || message.includes('connection')) {
    return 'We could not reach the live scholarship sources. Please check your internet connection and try again.';
  }

  if (message.includes('rate limit') || message.includes('429') || message.includes('quota')) {
    return 'The scholarship search service is busy right now. Please wait a moment and try again.';
  }

  if (message.includes('timeout')) {
    return 'The search timed out. Please try again with a simpler query.';
  }

  return error;
}

const ScholarshipService = {
  validateForm(_values: ScholarshipFormValues): string | null {
    return null;
  },

  buildFeatureInput(values: ScholarshipFormValues, profile: ScholarshipSearchRequest['profile']): Record<string, unknown> {
    const scope = getScopePreference(values);
    const scholarshipTypes = normalizeList(values.scholarshipTypes);
    const fundingCoverage = normalizeList(values.fundingCoverage);
    return {
      level: values.targetEducationLevel,
      targetEducationLevel: values.targetEducationLevel,
      targetDegree: values.targetDegree?.trim() || null,
      targetSpecialization: values.targetSpecialization?.trim() || null,
      studyLocation: values.studyLocation,
      preferredCountry: values.preferredCountry?.trim() || null,
      scopePreference: scope,
      countryPreference: scope === 'international' ? 'international' : scope === 'both' ? 'india_and_international' : 'india',
      course: inferCourse(profile, values),
      specialization: (values.targetSpecialization?.trim() || profile.specialization) ?? null,
      scholarshipTypes: scholarshipTypes.length > 0 ? scholarshipTypes : ['Any'],
      fundingCoverage: fundingCoverage.length > 0 ? fundingCoverage : ['Any'],
      fundingType: fundingCoverage.filter((item) => item !== 'Any'),
      applicationStatus: values.applicationStatus,
      maximumDistance: values.maximumDistance,
      userNationality: inferNationality(profile),
      institutionName: values.institutionName,
      eligibilityContext: {
        currentQualification: profile.qualification ?? null,
        currentSpecialization: profile.specialization ?? null,
        category: profile.category ?? null,
        annualIncome: profile.annual_income ?? null,
        gender: profile.gender ?? null,
        state: profile.state ?? null,
        pwdStatus: profile.pwd_status ?? null,
      },
    };
  },

  async searchScholarships(request: ScholarshipSearchRequest): Promise<ScholarshipSearchResponse> {
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
        error: 'Scholarship search is currently unavailable because the required AI services are not configured.',
        cached: false,
        searchDurationMs: 0,
        query: '',
        totalFound: 0,
      };
    }

    const profile = request.profile;
    const query = createSearchQuery(request.formValues, profile);
    const preferredDomains = buildPreferredDomains(request.formValues);

    const payload = {
      type: 'scholarship' as const,
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
      preferredDomains,
      maxResults: 80,
      searchDepth: 'advanced' as const,
    };

    const response = await SearchService.search<ScholarshipRecommendation>(payload);

    if (request.profile.user_id) {
      try {
        await supabase.from('search_history').insert({
          user_id: request.profile.user_id,
          query,
          category: 'scholarship',
          filters: {
            qualification: profile.qualification ?? null,
            currentDegree: profile.specialization ?? null,
            state: profile.state ?? null,
            income: profile.annual_income ?? null,
            category: profile.category ?? null,
            pwdStatus: profile.pwd_status ?? null,
            targetEducationLevel: request.formValues.targetEducationLevel,
            targetDegree: request.formValues.targetDegree,
            targetSpecialization: request.formValues.targetSpecialization,
            studyLocation: request.formValues.studyLocation,
            preferredCountry: request.formValues.preferredCountry,
            scholarshipTypes: request.formValues.scholarshipTypes,
            fundingCoverage: request.formValues.fundingCoverage,
            applicationStatus: request.formValues.applicationStatus,
            maximumDistance: request.formValues.maximumDistance,
          },
          results_count: response.totalFound,
        });
      } catch (historyError) {
        console.warn('ScholarshipService', 'Failed to save search history', historyError);
      }
    }

    return {
      results: response.results as ScholarshipRecommendation[],
      error: normalizeError(response.error),
      warning: response.warning ?? null,
      cached: response.cached,
      searchDurationMs: response.searchDurationMs,
      query: response.query || query,
      totalFound: response.totalFound,
    };
  },

  async saveScholarship(userId: string, scholarship: ScholarshipRecommendation): Promise<{ success: boolean; error: string | null }> {
    const itemId = `${scholarship.title}-${scholarship.provider ?? scholarship.source}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const res = await SavedItemsService.save({
      userId,
      itemType: 'scholarship',
      itemId,
      itemTitle: scholarship.title,
      itemMetadata: {
        provider: scholarship.provider ?? null,
        officialWebsite: scholarship.officialWebsite ?? null,
        applicationPortal: scholarship.applicationLink ?? null,
        sourceUrl: scholarship.source ?? null,
        amount: scholarship.amount ?? null,
        deadline: scholarship.deadline ?? null,
      },
      snapshot: scholarship as unknown as Record<string, unknown>,
    });
    if (res.error) return { success: false, error: res.error };
    return { success: true, error: null };
  },
};

export default ScholarshipService;
