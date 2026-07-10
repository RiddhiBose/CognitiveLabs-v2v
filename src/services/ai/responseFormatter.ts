// ResponseFormatter — parses and validates Gemini JSON output
// Converts raw AI text into strongly typed Recommendation objects.

import type {
  Recommendation,
  FeatureType,
  CollegeRecommendation,
  ScholarshipRecommendation,
  LoanRecommendation,
  StartupFundingRecommendation,
  FinancialLiteracyRecommendation,
} from '../../types/ai.types';
import { logger } from '../../utils/logger';

// Raw shape coming out of Gemini before validation
interface RawItem {
  title?: unknown;
  summary?: unknown;
  matchScore?: unknown;
  reason?: unknown;
  officialWebsite?: unknown;
  applicationLink?: unknown;
  source?: unknown;
  location?: unknown;
  metadata?: unknown;
}

function safeString(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val.trim();
  if (val == null) return fallback;
  return String(val).trim();
}

function safeNumber(val: unknown, min = 0, max = 100, fallback = 0): number {
  const n = Number(val);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function safeMetadata(val: unknown): Record<string, unknown> {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

function parseBase(raw: RawItem): Recommendation {
  return {
    title: safeString(raw.title, 'Untitled'),
    summary: safeString(raw.summary, 'No summary available.'),
    matchScore: safeNumber(raw.matchScore, 0, 100, 0),
    reason: safeString(raw.reason, 'Based on your profile.'),
    officialWebsite: safeString(raw.officialWebsite) || null,
    applicationLink: safeString(raw.applicationLink) || null,
    source: safeString(raw.source, 'Unknown source'),
    location: safeString(raw.location) || null,
    metadata: safeMetadata(raw.metadata),
  };
}

// Feature-specific parsers — extend base with typed metadata fields

function parseCollege(raw: RawItem): CollegeRecommendation {
  const meta = safeMetadata(raw.metadata);
  const applicationSteps = safeString(meta.applicationSteps);
  const requiredDocuments = safeString(meta.requiredDocuments);
  
  // MANDATORY: Application steps and required documents must be present
  if (!applicationSteps) {
    logger.warn('ResponseFormatter', 'College missing mandatory applicationSteps field', raw.title);
  }
  if (!requiredDocuments) {
    logger.warn('ResponseFormatter', 'College missing mandatory requiredDocuments field', raw.title);
  }
  
  return {
    ...parseBase(raw),
    courseName: safeString(meta.courseName) || undefined,
    entranceExam: safeString(meta.entranceExam) || undefined,
    fees: safeString(meta.fees) || undefined,
    ranking: safeString(meta.ranking) || undefined,
    cutoff: safeString(meta.cutoff) || undefined,
    collegeType: safeString(meta.collegeType) || undefined,
    hostelAvailable: typeof meta.hostelAvailable === 'boolean' ? meta.hostelAvailable : undefined,
    girlsOnly: typeof meta.girlsOnly === 'boolean' ? meta.girlsOnly : undefined,
    locationType: safeString(meta.locationType) || undefined,
    applicationSteps: applicationSteps || 'Please check official college website for application process',
    requiredDocuments: requiredDocuments || 'Please check official college website for document requirements',
  };
}

function parseScholarship(raw: RawItem): ScholarshipRecommendation {
  const meta = safeMetadata(raw.metadata);
  const amount = safeString(meta.amount);
  const applicationSteps = safeString(meta.applicationSteps);
  const requiredDocuments = safeString(meta.requiredDocuments);
  
  // MANDATORY: Scholarship amount, application steps, and required documents must be present
  if (!amount) {
    logger.warn('ResponseFormatter', 'Scholarship missing mandatory amount field', raw.title);
  }
  if (!applicationSteps) {
    logger.warn('ResponseFormatter', 'Scholarship missing mandatory applicationSteps field', raw.title);
  }
  if (!requiredDocuments) {
    logger.warn('ResponseFormatter', 'Scholarship missing mandatory requiredDocuments field', raw.title);
  }
  
  return {
    ...parseBase(raw),
    amount: amount || 'Amount not specified - please check official website',
    deadline: safeString(meta.deadline) || undefined,
    eligibility: safeString(meta.eligibility) || undefined,
    provider: safeString(meta.provider) || undefined,
    applicationSteps: applicationSteps || 'Please check official scholarship website for application process',
    requiredDocuments: requiredDocuments || 'Please check official scholarship website for document requirements',
  };
}

function parseLoan(raw: RawItem): LoanRecommendation {
  const meta = safeMetadata(raw.metadata);
  const interestRate = safeString(meta.interestRate);
  const applicationSteps = safeString(meta.applicationSteps);
  const requiredDocuments = safeString(meta.requiredDocuments);
  
  // MANDATORY: Interest rate, application steps, and required documents must be present
  if (!interestRate) {
    logger.warn('ResponseFormatter', 'Loan missing mandatory interestRate field', raw.title);
  }
  if (!applicationSteps) {
    logger.warn('ResponseFormatter', 'Loan missing mandatory applicationSteps field', raw.title);
  }
  if (!requiredDocuments) {
    logger.warn('ResponseFormatter', 'Loan missing mandatory requiredDocuments field', raw.title);
  }
  
  const base = parseBase(raw);
  
  // Special handling for PM Vidyalaxmi scheme to ensure correct official website
  const titleLower = safeString(raw.title).toLowerCase();
  const isPMVidyalaxmi = titleLower.includes('pm vidyalaxmi') || 
                         titleLower.includes('pm vidya laxmi') ||
                         titleLower.includes('vidyalaxmi');
  
  let officialWebsite = base.officialWebsite;
  let applicationLink = base.applicationLink;
  
  if (isPMVidyalaxmi) {
    officialWebsite = 'https://pmvidyalaxmi.co.in/AboutScheme.aspx';
    applicationLink = 'https://pmvidyalaxmi.co.in/';
  }
  
  return {
    ...base,
    officialWebsite,
    applicationLink,
    interestRate: interestRate || 'Rate not specified - please check official bank website',
    maxAmount: safeString(meta.maxAmount) || undefined,
    repaymentPeriod: safeString(meta.repaymentPeriod) || undefined,
    bank: safeString(meta.bank) || undefined,
    applicationSteps: applicationSteps || 'Please check official bank website for application process',
    requiredDocuments: requiredDocuments || 'Please check official bank website for document requirements',
  };
}

function parseStartupFunding(raw: RawItem): StartupFundingRecommendation {
  const meta = safeMetadata(raw.metadata);

  // applicationProcess and requiredDocuments are MANDATORY
  const applicationProcess = safeString(meta.applicationProcess);
  const requiredDocuments = safeString(meta.requiredDocuments);

  if (!applicationProcess) {
    logger.warn('ResponseFormatter', 'StartupFunding missing mandatory applicationProcess field', raw.title);
  }
  if (!requiredDocuments) {
    logger.warn('ResponseFormatter', 'StartupFunding missing mandatory requiredDocuments field', raw.title);
  }

  // sourceType must be exactly 'Official' or 'Trusted Public Source'
  const rawSourceType = safeString(meta.sourceType);
  const sourceType = rawSourceType === 'Official' ? 'Official'
    : rawSourceType ? 'Trusted Public Source'
    : 'Trusted Public Source';

  return {
    ...parseBase(raw),
    // Core
    organization: safeString(meta.organization) || undefined,
    fundingType: safeString(meta.fundingType) || undefined,
    sector: safeString(meta.sector) || undefined,
    stage: safeString(meta.stage) || undefined,
    // Amounts
    minAmount: safeString(meta.minAmount) || undefined,
    maxAmount: safeString(meta.maxAmount) || undefined,
    // Eligibility
    eligibility: safeString(meta.eligibility) || undefined,
    womenFounderPreference: safeString(meta.womenFounderPreference) || undefined,
    registrationRequired: safeString(meta.registrationRequired) || undefined,
    revenueStageRequired: safeString(meta.revenueStageRequired) || undefined,
    // Terms
    equityRequirement: safeString(meta.equityRequirement) || undefined,
    // Application
    deadline: safeString(meta.deadline) || undefined,
    applicationProcess: applicationProcess || 'Please check the official website for the application process.',
    requiredDocuments: requiredDocuments || 'Please check the official website for required documents.',
    benefits: safeString(meta.benefits) || undefined,
    applicationPortal: safeString(meta.applicationPortal) || undefined,
    contactInfo: safeString(meta.contactInfo) || undefined,
    // Credibility
    sourceType,
  };
}

function parseFinancialLiteracy(raw: RawItem): FinancialLiteracyRecommendation {
  const meta = safeMetadata(raw.metadata);

  // Helper to validate URLs
  const getValidUrl = (...values: unknown[]): string | null => {
    for (const value of values) {
      const url = safeString(value);
      if (!url) continue;

      // Skip placeholder URLs
      if (['#', 'n/a', 'coming soon', 'not available', 'tbd', 'to be determined'].includes(url.toLowerCase())) {
        continue;
      }

      const normalized =
        /^https?:\/\//i.test(url) ? url : `https://${url}`;

      try {
        const urlObj = new URL(normalized);
        // Ensure URL has a valid hostname
        if (!urlObj.hostname || urlObj.hostname.length < 3) {
          continue;
        }

        // Skip lesson/chapter/content pages - these are not enrollment pages
        const pathLower = urlObj.pathname.toLowerCase();
        if (pathLower.includes('/lesson/') ||
            pathLower.includes('/chapter/') ||
            pathLower.includes('/content/') ||
            pathLower.includes('/topic/')) {
          continue;
        }

        // Skip individual module pages that are clearly lessons (not main course pages)
        // Pattern: module pages with + in filename are typically individual lessons
        if (pathLower.includes('/module/') && pathLower.includes('+') && pathLower.endsWith('.html')) {
          continue;
        }

        return normalized;
      } catch {
        continue;
      }
    }

    return null;
  };

  const officialWebsite = getValidUrl(
    raw.officialWebsite,
    meta.officialWebsite,
    meta.website,
    meta.url,
    meta.sourceUrl
  );

  const applicationLink = getValidUrl(
    raw.applicationLink,
    meta.applicationLink,
    meta.enrollmentLink,
    meta.applyLink,
    meta.registrationLink,
    officialWebsite
  );

  // Log warnings if URLs are missing
  if (!officialWebsite && !applicationLink) {
    logger.warn('ResponseFormatter', 'FinancialLiteracy missing both officialWebsite and applicationLink', raw.title);
  }

  return {
    ...parseBase({
      ...raw,
      officialWebsite,
      applicationLink,
    }),

    topic: safeString(meta.topic) ||
      safeString((raw as Record<string, unknown>).topic) ||
      undefined,

    provider:
      safeString(meta.provider) ||
      safeString((raw as Record<string, unknown>).provider) ||
      undefined,

    duration: safeString(meta.duration) ||
      safeString((raw as Record<string, unknown>).duration) ||
      undefined,

    level: safeString(meta.level) ||
      safeString((raw as Record<string, unknown>).level) ||
      undefined,

    isFree:
      meta.isFree === true ||
      meta.isFree === 'true'
        ? true
        : meta.isFree === false ||
            meta.isFree === 'false'
          ? false
          : undefined,

    metadata: {
      ...meta,

      syllabus: meta.syllabus ?? null,

      learningOutcomes: meta.learningOutcomes ?? null,

      prerequisites: meta.prerequisites ?? null,

      certificateAvailable:
        meta.certificateAvailable ??
        meta.certificate ??
        null,

      officialWebsite,

      applicationLink,
    },
  };
}

const PARSERS: Record<FeatureType, (raw: RawItem) => Recommendation> = {
  college: parseCollege,
  scholarship: parseScholarship,
  education_loan: parseLoan,
  startup_funding: parseStartupFunding,
  financial_literacy: parseFinancialLiteracy,
};

const ResponseFormatter = {
  /**
   * Parse raw Gemini text output into typed Recommendation objects.
   * Returns an empty array if the response is malformed — never throws.
   */
  parse<T extends Recommendation>(rawText: string, featureType: FeatureType): T[] {
    if (!rawText.trim()) {
      logger.warn('ResponseFormatter', 'Received empty response from Gemini');
      return [];
    }

    // Strip markdown code fences if Gemini wraps in them despite instructions
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON array from within larger text
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          logger.error('ResponseFormatter', 'Failed to parse JSON from Gemini response', cleaned.slice(0, 200));
          return [];
        }
      } else {
        logger.error('ResponseFormatter', 'No JSON array found in Gemini response', cleaned.slice(0, 200));
        return [];
      }
    }

    if (!Array.isArray(parsed)) {
      logger.warn('ResponseFormatter', 'Gemini response is not an array');
      return [];
    }

    const parser = PARSERS[featureType];
    const results: T[] = [];

    for (const item of parsed) {
      try {
        if (item && typeof item === 'object') {
          results.push(parser(item as RawItem) as T);
        }
      } catch (err) {
        logger.warn('ResponseFormatter', 'Skipped malformed item', err);
      }
    }

    // Sort by matchScore descending
    return results.sort((a, b) => b.matchScore - a.matchScore);
  },

  /**
   * Check if a response looks like a valid JSON array before parsing.
   */
  isValidResponse(text: string): boolean {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    return cleaned.startsWith('[') && cleaned.includes(']');
  },
};

export default ResponseFormatter;
