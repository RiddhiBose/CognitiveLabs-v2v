// ResponseFormatter — parses and validates Gemini JSON output
// Converts raw AI text into strongly typed Recommendation objects.

import type {
  Recommendation,
  FeatureType,
  CollegeRecommendation,
  ScholarshipRecommendation,
  LoanRecommendation,
  GovernmentSchemeRecommendation,
  StartupFundingRecommendation,
  InternshipRecommendation,
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
  return {
    ...parseBase(raw),
    courseName: safeString(meta.courseName) || undefined,
    entranceExam: safeString(meta.entranceExam) || undefined,
    fees: safeString(meta.fees) || undefined,
    ranking: safeString(meta.ranking) || undefined,
  };
}

function parseScholarship(raw: RawItem): ScholarshipRecommendation {
  const meta = safeMetadata(raw.metadata);
  return {
    ...parseBase(raw),
    amount: safeString(meta.amount) || undefined,
    deadline: safeString(meta.deadline) || undefined,
    eligibility: safeString(meta.eligibility) || undefined,
    provider: safeString(meta.provider) || undefined,
  };
}

function parseLoan(raw: RawItem): LoanRecommendation {
  const meta = safeMetadata(raw.metadata);
  return {
    ...parseBase(raw),
    interestRate: safeString(meta.interestRate) || undefined,
    maxAmount: safeString(meta.maxAmount) || undefined,
    repaymentPeriod: safeString(meta.repaymentPeriod) || undefined,
    bank: safeString(meta.bank) || undefined,
  };
}

function parseGovernmentScheme(raw: RawItem): GovernmentSchemeRecommendation {
  const meta = safeMetadata(raw.metadata);
  return {
    ...parseBase(raw),
    ministry: safeString(meta.ministry) || undefined,
    benefitType: safeString(meta.benefitType) || undefined,
    deadline: safeString(meta.deadline) || undefined,
  };
}

function parseStartupFunding(raw: RawItem): StartupFundingRecommendation {
  const meta = safeMetadata(raw.metadata);
  return {
    ...parseBase(raw),
    fundingType: safeString(meta.fundingType) || undefined,
    maxAmount: safeString(meta.maxAmount) || undefined,
    stage: safeString(meta.stage) || undefined,
    sector: safeString(meta.sector) || undefined,
  };
}

function parseInternship(raw: RawItem): InternshipRecommendation {
  const meta = safeMetadata(raw.metadata);
  const skills = Array.isArray(meta.skills)
    ? meta.skills.filter((s): s is string => typeof s === 'string')
    : undefined;
  return {
    ...parseBase(raw),
    company: safeString(meta.company) || undefined,
    duration: safeString(meta.duration) || undefined,
    stipend: safeString(meta.stipend) || undefined,
    skills,
    applyBy: safeString(meta.applyBy) || undefined,
  };
}

function parseFinancialLiteracy(raw: RawItem): FinancialLiteracyRecommendation {
  const meta = safeMetadata(raw.metadata);
  return {
    ...parseBase(raw),
    topic: safeString(meta.topic) || undefined,
    provider: safeString(meta.provider) || undefined,
    duration: safeString(meta.duration) || undefined,
    level: safeString(meta.level) || undefined,
    isFree: meta.isFree === true || meta.isFree === 'true' ? true
           : meta.isFree === false || meta.isFree === 'false' ? false
           : undefined,
  };
}

const PARSERS: Record<FeatureType, (raw: RawItem) => Recommendation> = {
  college: parseCollege,
  scholarship: parseScholarship,
  education_loan: parseLoan,
  government_scheme: parseGovernmentScheme,
  startup_funding: parseStartupFunding,
  internship: parseInternship,
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
