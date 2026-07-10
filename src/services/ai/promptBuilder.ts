// PromptBuilder — dynamically builds Gemini prompts per feature type
// No UI code. No API calls. Pure prompt construction.

import type { PromptContext, FeatureType, UserProfileForSearch } from '../../types/ai.types';
import TavilyService from './tavilyService';

// Shared instructions injected into every prompt
const SHARED_RULES = `
CRITICAL RULES:
- Only use information present in the search results provided below.
- Never fabricate, invent, or assume any detail not found in the search results.
- Never invent eligibility criteria, fees, deadlines, or URLs.
- For financial literacy courses: officialWebsite and applicationLink are MANDATORY. Only use URLs explicitly present in search results. Never fabricate or guess URLs.
- For education loans: interest rate is MANDATORY. If not found on official bank website, search trusted sources for estimated rates. Never leave as "Not available".
- For scholarships: scholarship amount range is MANDATORY. If not found on official website, search trusted sources for estimated amounts. Never leave as "Not available".
- Prefer official government, institutional and regulatory sources over blogs or news sites.
- Respect user preferences as hard constraints whenever possible.
- If the user selects International scholarships, prioritize international scholarships first.
- Only recommend Indian scholarships if the user selected India, Both, or no verified international scholarship exists.
- Your entire response MUST be a valid JSON array only — no markdown, no explanation text, no code fences.
- Each item must have all required fields. Use null for unavailable fields (except mandatory fields).
- matchScore must be an integer from 0 to 100 based on how well this matches the user profile.
`.trim();

const OUTPUT_SCHEMA = `
Response format (JSON array):
[
  {
    "title": "string",
    "summary": "string (2-3 sentences)",
    "matchScore": number (0-100),
    "reason": "string (why this matches the user's profile)",
    "officialWebsite": "string | null",
    "applicationLink": "string | null",
    "source": "string (URL this info came from)",
    "location": "string | null",
    "metadata": { ...feature-specific fields }
  }
]
`.trim();

// ── Profile summary builders ────────────────────────────────────────────────

function buildProfileSummary(profile: UserProfileForSearch): string {
  const lines: string[] = [
    `Name: ${profile.full_name}`,
    `Role: ${profile.role}`,
    profile.qualification ? `Qualification: ${profile.qualification}${profile.qualification_other ? ` (${profile.qualification_other})` : ''}` : '',
    profile.specialization ? `Specialization: ${profile.specialization}` : '',
    profile.occupation ? `Occupation: ${profile.occupation}` : '',
    profile.experience != null ? `Experience: ${profile.experience} years` : '',
    profile.job_title ? `Job Title: ${profile.job_title}` : '',
    profile.industry ? `Industry: ${profile.industry}` : '',
    profile.annual_income ? `Annual Family Income: ${profile.annual_income}` : '',
    profile.category ? `Category: ${profile.category}` : '',
    profile.pwd_status === 'yes' ? 'PWD: Yes' : '',
    profile.state ? `State: ${profile.state}` : '',
    profile.city ? `City: ${profile.city}` : '',
    profile.bio ? `Bio: ${profile.bio.slice(0, 200)}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

// ── Feature-specific metadata hints ─────────────────────────────────────────

const METADATA_HINTS: Record<FeatureType, string> = {
  college: `metadata fields: { "courseName": string, "entranceExam": string | null, "fees": string | null, "ranking": string | null, "cutoff": string | null, "collegeType": string | null, "hostelAvailable": boolean | null, "girlsOnly": boolean | null, "locationType": string | null, "applicationSteps": string (MANDATORY - steps to apply from official college website or trusted sources), "requiredDocuments": string (MANDATORY - documents required from official college website or trusted sources) }`,
  scholarship: `metadata fields: { "amount": string (MANDATORY - must include scholarship amount range, never null), "deadline": string | null, "eligibility": string | null, "provider": string | null, "applicationSteps": string (MANDATORY - steps to apply from official scholarship website or trusted sources), "requiredDocuments": string (MANDATORY - documents required from official scholarship website or trusted sources) }`,
  education_loan: `metadata fields: { "interestRate": string (MANDATORY - must include interest rate, never null), "maxAmount": string | null, "repaymentPeriod": string | null, "bank": string | null, "applicationSteps": string (MANDATORY - steps to apply from official bank website or trusted sources), "requiredDocuments": string (MANDATORY - documents required from official bank website or trusted sources) }`,
  government_scheme: `metadata fields: { "ministry": string | null, "benefitType": string | null, "deadline": string | null }`,
  startup_funding: `metadata fields: { "fundingType": string | null, "maxAmount": string | null, "stage": string | null, "sector": string | null }`,
  financial_literacy: `metadata fields: { "topic": string | null, "provider": string | null, "duration": string | null, "level": string | null, "isFree": boolean | null, "officialWebsite": string | null (MANDATORY - official course page URL from search results, never use catalog pages like exploreAllCourses.html), "applicationLink": string | null (MANDATORY - direct enrollment/application URL from search results, prefer over officialWebsite. For NISM, individual course pages like "https://online.nism.ac.in/module/CourseName.html" ARE the correct enrollment links) }`,
};

// ── Feature-specific task descriptions ──────────────────────────────────────

function buildFeatureTask(type: FeatureType, profile: UserProfileForSearch, featureInput: Record<string, unknown>): string {
  const state = profile.state ?? 'India';

  switch (type) {
    case 'college':
      return `
Task: Identify the most relevant colleges/universities for this user based on their profile and the following preferences:
Preferred Course: ${featureInput.course ?? profile.specialization ?? 'Not specified'}
Preferred State: ${featureInput.state ?? state}
Entrance Exam: ${featureInput.entranceExam ?? 'Not specified'}
College Type: ${featureInput.collegeType ?? 'Any'}
Budget: ${featureInput.budget ?? 'No Preference'}
Hostel Required: ${featureInput.hostelRequired ?? 'No Preference'}
Girls Only: ${featureInput.girlsOnly ?? 'No Preference'}
Location: ${featureInput.location ?? 'No Preference'}
Class 12 Percentage: ${featureInput.class12Percentage ?? 'Not specified'}
Passing Year: ${featureInput.passingYear ?? 'Not specified'}
Board: ${featureInput.board ?? 'Not specified'}

CRITICAL: Application steps and required documents are MANDATORY for every college recommendation.
- First priority: Search official college website for admission process and document requirements
- If not found on official website: Search trusted educational portals, government counseling websites, or verified sources
- Never leave application steps or required documents as "Not available" or null
- If exact information is unavailable, provide general application process based on trusted sources

Focus on:
- Accreditation status (NAAC, NBA, AICTE approval)
- Admission process and entrance exams
- Fees and scholarship availability (must align with user's budget)
- NIRF rankings where available
- Government / aided / private distinction
- Cutoff information mentioned in the sources, especially for the user's entrance exam rank/score/percentile
- Whether the college is a good fit for the preferred state and college type
- Whether hostels are available (if user requested)
- Whether the college is girls-only (if user requested)
- Whether the location type matches the user's preference
- Class 12 percentage eligibility criteria
- Application steps (MANDATORY - from official college website or trusted sources)
- Required documents (MANDATORY - from official college website or trusted sources)
`.trim();

    case 'scholarship':
      return `
Task: Identify verified scholarships this user is eligible for based on their current profile and the target scholarship goal.
Current Qualification: ${profile.qualification ?? 'Not specified'}
Current Degree / Specialization: ${profile.specialization ?? 'Not specified'}
Target Education Level: ${featureInput.targetEducationLevel ?? featureInput.level ?? 'Any'}
Target Degree: ${featureInput.targetDegree ?? 'Not specified'}
Target Specialization: ${featureInput.targetSpecialization ?? 'Not specified'}
Study Location: ${featureInput.studyLocation ?? featureInput.scopePreference ?? 'Both'}
Preferred Country: ${featureInput.preferredCountry ?? 'Any'}
Course: ${featureInput.course ?? profile.specialization ?? 'Not specified'}
Scope Preference: ${featureInput.scopePreference ?? 'both'}
Country Preference: ${featureInput.countryPreference ?? 'india_and_international'}
User Nationality: ${featureInput.userNationality ?? 'Indian'}
Funding Type Preference: ${Array.isArray(featureInput.fundingType) ? featureInput.fundingType.join(', ') : featureInput.fundingCoverage ?? 'Any'}
Scholarship Types: ${Array.isArray(featureInput.scholarshipTypes) ? featureInput.scholarshipTypes.join(', ') : 'Any'}
Application Status: ${featureInput.applicationStatus ?? 'Open Applications Only'}
State: ${state}
Income: ${profile.annual_income ?? 'Not specified'}
Category: ${profile.category ?? 'Not specified'}
PWD: ${profile.pwd_status === 'yes' ? 'Yes' : 'No'}

CRITICAL: Scholarship amount range, application steps, and required documents are MANDATORY for every scholarship recommendation.
- First priority: Search official scholarship websites, university pages, and government portals for exact amounts and application details
- If not found on official website: Search trusted scholarship databases, education portals, or verified sources for estimated amounts and application process
- Never leave scholarship amount, application steps, or required documents as "Not available" or null
- If exact information is unavailable, provide estimated ranges and general application process based on trusted sources

Ranking priority:
1. Study location and country preference
2. Eligibility from the current profile
3. Target education level and degree
4. Target specialization
5. Funding coverage
6. Scholarship type
7. Academic profile

Focus on:
- Official scholarship portals, government portals, university pages and verified scholarship websites only
- International scholarships first when the user selected International or Both
- India-only scholarships when the user selected India
- Broad search behavior when scholarship type, funding coverage or location are set to Any
- Application deadlines, scholarship amounts (MANDATORY - from official websites or trusted sources), eligibility, and official links
- Application steps (MANDATORY - from official scholarship website or trusted sources)
- Required documents (MANDATORY - from official scholarship website or trusted sources)
`.trim();

    case 'education_loan':
      return `
Task: Identify education loan options suitable for this user.
Course: ${featureInput.course ?? profile.specialization ?? 'Not specified'}
Institution: ${featureInput.institution ?? 'Not specified'}
Loan Amount Needed: ${featureInput.loanAmount ?? 'Not specified'}
State: ${state}
Income: ${profile.annual_income ?? 'Not specified'}
Category: ${profile.category ?? 'Not specified'}

CRITICAL: Interest rate, application steps, and required documents are MANDATORY for every loan recommendation.
- First priority: Search official bank websites for current interest rates and application process
- If not found on official website: Search trusted financial sources, government portals, or comparison sites for estimated rates and application details
- Never leave interest rate, application steps, or required documents as "Not available" or null
- If exact information is unavailable, provide estimated ranges and general application process based on trusted sources

Focus on:
- Government bank loans (SBI, BOB, PNB, Canara)
- Vidya Lakshmi portal schemes
- Interest rates (MANDATORY - from official bank websites or trusted sources)
- Application steps (MANDATORY - from official bank website or trusted sources)
- Required documents (MANDATORY - from official bank website or trusted sources)
- Subsidy availability
- Moratorium periods and repayment
- Collateral requirements
`.trim();

    case 'government_scheme':
      return `
Task: Identify government schemes this user is eligible for.
State: ${state}
Category: ${profile.category ?? 'Not specified'}
Income: ${profile.annual_income ?? 'Not specified'}
Occupation: ${profile.occupation ?? 'Not specified'}
PWD: ${profile.pwd_status === 'yes' ? 'Yes' : 'No'}
Scheme Type Preference: ${featureInput.schemeType ?? 'All'}

Focus on:
- Central government schemes (myscheme.gov.in)
- State government welfare schemes
- Women empowerment schemes
- Education and skill development schemes
- Financial assistance schemes
`.trim();

    case 'startup_funding':
      return `
Task: Identify startup funding opportunities for this user.
Startup Stage: ${featureInput.stage ?? 'Not specified'}
Sector: ${featureInput.sector ?? profile.industry ?? 'Not specified'}
State: ${state}
Funding Type Preference: ${featureInput.fundingType ?? 'All'}

Focus on:
- Startup India schemes
- SIDBI funding programs
- MSME grants
- Women entrepreneur schemes
- State incubation programs
- Government seed funding
`.trim();

    case 'financial_literacy': {
      const knowledgeLevel = String(featureInput.knowledgeLevel ?? 'Beginner');
      const learningGoals = Array.isArray(featureInput.learningGoals)
        ? featureInput.learningGoals.filter((item): item is string => typeof item === 'string')
        : [];
      const courseLevel = String(featureInput.courseLevel ?? 'Any');
      const courseFormat = Array.isArray(featureInput.courseFormat)
        ? featureInput.courseFormat.filter((item): item is string => typeof item === 'string')
        : [];
      const budget = String(featureInput.budget ?? 'Both');
      const certificate = String(featureInput.certificatePreference ?? 'No Preference');
      const language = String(featureInput.language ?? 'Any');
      const platformPreference = Array.isArray(featureInput.platformPreference)
        ? featureInput.platformPreference.filter((item): item is string => typeof item === 'string')
        : [];

      return `
Task: Identify verified financial literacy courses this user is eligible for based on their current profile and learning goals.
Current Qualification: ${profile.qualification ?? 'Not specified'}
Current Occupation: ${profile.occupation ?? 'Not specified'}
Current Experience: ${profile.experience ? `${profile.experience} years` : 'Not specified'}
Current Knowledge Level: ${knowledgeLevel}
Learning Goals: ${learningGoals.length > 0 ? learningGoals.join(', ') : 'Any'}
Target Course Level: ${courseLevel}
Preferred Course Format: ${courseFormat.length > 0 ? courseFormat.join(', ') : 'Any'}
Budget Preference: ${budget}
Certificate Requirement: ${certificate}
Preferred Language: ${language}
Platform Preference: ${platformPreference.length > 0 ? platformPreference.join(', ') : 'Any'}
State: ${state}

CRITICAL: Official website URL and enrollment/application URL are MANDATORY for every financial literacy course recommendation.
- First priority: Extract direct enrollment/application URL from search results (this is the applicationLink) - look for URLs with "enroll", "register", "apply", "join", "sign-up", "enrollment" in the path
- Second priority: Extract official course catalog/landing page URL from search results (this is the officialWebsite) - the main course page, not individual module/content pages
- For NISM specifically: Individual course pages are at URLs like "https://online.nism.ac.in/module/CourseName.html" - these ARE the correct course pages and should be used as enrollment links. The catalog page "https://online.nism.ac.in/exploreAllCourses.html" should NOT be used as an enrollment link.
- NEVER use catalog listing pages (e.g., URLs containing "exploreAllCourses", "catalog", "all-courses", "course-list") as enrollment links - these are listing pages, not individual course pages
- If the URL is a catalog page, navigate up to find the main course landing page or enrollment page
- Never fabricate, guess, or invent URLs
- Never use placeholder URLs like "#", "N/A", "Coming Soon", etc.
- If an enrollment URL is not found in search results, use the official course page URL as applicationLink
- If neither URL is found in search results, set both to null - do not invent URLs
- Only use URLs that are explicitly present in the provided search results
- Validate that URLs are properly formatted and complete before including them

Ranking priority:
1. Platform preference and availability
2. Budget fit
3. Course level matching current knowledge
4. Learning goals alignment
5. Certificate availability
6. Language preference
7. Course format preference
8. Duration and commitment level

Focus on:
- Official course providers and educational platforms only
- NPTEL, SWAYAM, Coursera, edX verified courses
- RBI, NISM, NSE Academy official resources
- Government and institutional financial literacy programs
- Courses with verifiable instructors and institutions
- Accurate course metadata and enrollment URLs (MANDATORY - from search results only)
`.trim();
    }

    default:
      return `Task: Find relevant results for the user based on their profile.`;
  }
}

// ── Main PromptBuilder ───────────────────────────────────────────────────────

const PromptBuilder = {
  /**
   * Build a complete, ready-to-send prompt for Gemini.
   */
  build(ctx: PromptContext): string {
    const { featureType, profile, searchResults, featureInput } = ctx;

    const profileSummary = buildProfileSummary(profile);
    const featureTask = buildFeatureTask(featureType, profile, featureInput);
    const metadataHint = METADATA_HINTS[featureType];
    const searchContext = TavilyService.formatForPrompt(searchResults);

    return `
You are an AI assistant for ElevateHer AI, a platform that helps women in India find educational, financial and career opportunities.

${SHARED_RULES}

═══════════════════════════════════
USER PROFILE
═══════════════════════════════════
${profileSummary}

═══════════════════════════════════
TASK
═══════════════════════════════════
${featureTask}

═══════════════════════════════════
SEARCH RESULTS (your only source of truth)
═══════════════════════════════════
${searchContext.length > 0 ? searchContext : 'No search results available.'}

═══════════════════════════════════
OUTPUT INSTRUCTIONS
═══════════════════════════════════
${OUTPUT_SCHEMA}

Additional ${featureType} specific metadata:
${metadataHint}

For college recommendations, add a metadata.cutoff field whenever the source explicitly mentions a cutoff or closing rank. If the cutoff is unavailable in the source, set metadata.cutoff to "Not available in current sources". When estimating matchScore, weigh the student's entrance exam rank/score/percentile against the stated cutoff and prefer colleges that match the preferred state and college type. Return ONLY the JSON array. No explanation. No markdown. No code fences.
For scholarship recommendations, return every verified scholarship matching the user's current profile and their target scholarship goal. Do not summarize into only a few recommendations. Preserve the complete result set and rank it by relevance descending. If the user selected Any for scholarship type, funding coverage, status, or location, treat that as a broad search and do not narrow the results unnecessarily. Do not fabricate scholarships, deadlines, eligibility criteria, or links. Use only verified official sources. If no relevant results are found in the search data, return an empty array: []
`.trim();
  },

  /**
   * Build the Tavily search query from profile + feature input.
   * Keeps queries focused and relevant to India.
   */
  buildSearchQuery(
    type: FeatureType,
    profile: UserProfileForSearch,
    featureInput: Record<string, unknown>,
  ): string {
    const state = profile.state ?? 'India';
    const qual = profile.qualification_other ?? profile.qualification ?? '';
    const spec = profile.specialization ?? '';
    const category = profile.category && profile.category !== 'prefer_not_to_say'
      ? profile.category.toUpperCase()
      : '';

    switch (type) {
      case 'college':
        return [
          featureInput.course ?? spec,
          'college admission cutoff 2024 2025',
          'admission process steps',
          'documents required for admission',
          featureInput.state ?? state,
          featureInput.entranceExam,
          featureInput.collegeType && featureInput.collegeType !== 'Any' ? featureInput.collegeType : '',
          featureInput.budget && featureInput.budget !== 'No Preference' ? featureInput.budget : '',
          'official college website',
        ].filter(Boolean).join(' ');

      case 'scholarship': {
        const scopePreference = String(featureInput.scopePreference ?? 'both');
        const level = String(featureInput.targetEducationLevel ?? featureInput.level ?? 'any');
        const targetDegree = String(featureInput.targetDegree ?? '').trim();
        const targetSpecialization = String(featureInput.targetSpecialization ?? '').trim();
        const preferredCountry = String(featureInput.preferredCountry ?? '').trim();
        const course = String(featureInput.course ?? spec ?? 'engineering');
        const fundingTypes = Array.isArray(featureInput.fundingType)
          ? featureInput.fundingType.filter((item): item is string => typeof item === 'string')
          : [];
        const scholarshipTypes = Array.isArray(featureInput.scholarshipTypes)
          ? featureInput.scholarshipTypes.filter((item): item is string => typeof item === 'string')
          : [];
        const applicationStatus = String(featureInput.applicationStatus ?? 'Open Applications Only');
        const statusPhrase = applicationStatus === 'Open Applications Only'
          ? 'currently open'
          : applicationStatus === 'Upcoming'
            ? 'upcoming'
            : 'currently open and upcoming';
        const scopePhrase = scopePreference === 'international'
          ? `international ${level === 'Any' ? 'scholarships' : `${level.toLowerCase()} scholarships`}`
          : scopePreference === 'both'
            ? `${level === 'Any' ? 'scholarships' : `${level.toLowerCase()} scholarships`}`
            : `indian ${level === 'Any' ? 'scholarships' : `${level.toLowerCase()} scholarships`}`;

        const fundingPhrase = fundingTypes.includes('Full Scholarship')
          ? 'fully funded'
          : fundingTypes.includes('Partial Scholarship')
            ? 'partially funded'
            : '';
        const typesPhrase = scholarshipTypes.length > 0 ? scholarshipTypes.join(' ') : 'all scholarship types';
        const goalPhrase = targetDegree || targetSpecialization
          ? `for ${targetDegree || targetSpecialization}`
          : `for ${course} students`;
        const countryPhrase = preferredCountry && preferredCountry.toLowerCase() !== 'any' ? `in ${preferredCountry}` : '';

        return [
          scopePhrase,
          statusPhrase,
          fundingPhrase,
          typesPhrase,
          goalPhrase,
          countryPhrase,
          'scholarship amount range',
          'application process steps',
          'documents required',
          'official scholarship website',
          category ? category.toLowerCase() : '',
          state,
          profile.annual_income?.includes('below') || profile.annual_income?.includes('2l') ? 'low income' : '',
          profile.pwd_status === 'yes' ? 'PWD disability' : '',
          'official websites university portals government portals',
          '2024 2025',
        ].filter(Boolean).join(' ');
      }

      case 'education_loan':
        return [
          'education loan interest rate',
          'application process steps',
          'documents required',
          featureInput.course ?? qual,
          featureInput.institution,
          'official bank website',
          'SBI PNB Canara Bank of Baroda interest rates',
          'Vidya Lakshmi portal',
          category ? `${category} subsidy` : '',
          'India 2024',
        ].filter(Boolean).join(' ');

      case 'government_scheme':
        return [
          'government scheme',
          'women',
          featureInput.schemeType ?? '',
          state,
          category,
          profile.pwd_status === 'yes' ? 'disability' : '',
          'India 2024',
        ].filter(Boolean).join(' ');

      case 'startup_funding':
        return [
          'startup funding',
          'women entrepreneur',
          featureInput.sector ?? profile.industry ?? '',
          featureInput.stage ?? 'early stage',
          state,
          'India 2024',
        ].filter(Boolean).join(' ');

      case 'financial_literacy': {
        const knowledgeLevel = String(featureInput.knowledgeLevel ?? 'any level');
        const learningGoals = Array.isArray(featureInput.learningGoals)
          ? featureInput.learningGoals
              .filter((item): item is string => typeof item === 'string' && item.toLowerCase() !== 'any')
              .join(' ')
              .toLowerCase()
          : 'financial literacy';
        const courseLevel = String(featureInput.courseLevel ?? 'any level');
        const courseFormats = Array.isArray(featureInput.courseFormat)
          ? featureInput.courseFormat
              .filter((item): item is string => typeof item === 'string' && item.toLowerCase() !== 'any')
              .join(' ')
              .toLowerCase()
          : 'any format';
        const budget = String(featureInput.budget ?? 'both');
        const certificate = String(featureInput.certificatePreference ?? 'no preference');
        const language = String(featureInput.language ?? 'any language');
        const platformPreference = Array.isArray(featureInput.platformPreference)
          ? featureInput.platformPreference
              .filter((item): item is string => typeof item === 'string' && item.toLowerCase() !== 'any')
              .join(' ')
              .toLowerCase()
          : 'all platforms';

        const budgetPhrase = budget === 'free' ? 'free' : budget === 'paid' ? 'paid' : 'free and paid';
        const certificatePhrase = certificate.includes('Required') ? 'with certificate' : '';

        // For NISM, specifically search for individual course pages
        const nismSpecific = platformPreference.includes('nism')
          ? 'site:online.nism.ac.in/module/ individual course pages'
          : '';

        return [
          'verified financial literacy courses',
          learningGoals,
          `${knowledgeLevel} level`,
          `${courseLevel} course level`,
          `${courseFormats} format`,
          `${budgetPhrase} courses`,
          certificatePhrase,
          language,
          `on ${platformPreference}`,
          nismSpecific,
          `for ${profile.occupation || profile.specialization || 'professionals'}`,
          state ? `in ${state}` : '',
          'from official providers verified sources',
          '2024 2025 2026',
        ]
          .filter(Boolean)
          .join(' ');
      }

      default:
        return `${type} opportunities India 2024`;
    }
  },
};

export default PromptBuilder;
