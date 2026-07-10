// PromptBuilder — dynamically builds Gemini prompts per feature type
// No UI code. No API calls. Pure prompt construction.

import type { PromptContext, FeatureType, UserProfileForSearch } from '../../types/ai.types';
import TavilyService from './tavilyService';

// Shared instructions injected into every prompt
const SHARED_RULES = `
CRITICAL RULES:
- Only use information present in the search results provided below.
- Never fabricate, invent, or assume any detail not found in the search results.
- Never invent eligibility criteria, fees, deadlines, interest rates, amounts or URLs.
- If a piece of information is not found in the search results, state "Not available in current sources" for that field.
- Prefer official government, institutional and regulatory sources over blogs or news sites.
- Respect user preferences as hard constraints whenever possible.
- If the user selects International scholarships, prioritize international scholarships first.
- Only recommend Indian scholarships if the user selected India, Both, or no verified international scholarship exists.
- Your entire response MUST be a valid JSON array only — no markdown, no explanation text, no code fences.
- Each item must have all required fields. Use null for unavailable fields.
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
  college: `metadata fields: { "courseName": string, "entranceExam": string | null, "fees": string | null, "ranking": string | null, "cutoff": string | null, "collegeType": string | null, "hostelAvailable": boolean | null, "girlsOnly": boolean | null, "locationType": string | null }`,
  scholarship: `metadata fields: { "amount": string | null, "deadline": string | null, "eligibility": string | null, "provider": string | null }`,
  education_loan: `metadata fields: { "interestRate": string | null, "maxAmount": string | null, "repaymentPeriod": string | null, "bank": string | null }`,
  government_scheme: `metadata fields: { "ministry": string | null, "benefitType": string | null, "deadline": string | null }`,
  startup_funding: `metadata fields: { "fundingType": string | null, "maxAmount": string | null, "stage": string | null, "sector": string | null }`,
  internship: `metadata fields: { "company": string | null, "duration": string | null, "stipend": string | null, "skills": string[] | null, "applyBy": string | null }`,
  financial_literacy: `metadata fields: { "topic": string | null, "provider": string | null, "duration": string | null, "level": string | null, "isFree": boolean | null }`,
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
- Application deadlines, funding amounts, eligibility, and official links
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

Focus on:
- Government bank loans (SBI, BOB, PNB, Canara)
- Vidya Lakshmi portal schemes
- Interest rates and subsidy availability
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

    case 'internship':
      return `
Task: Identify internship opportunities for this user.
Skills: ${featureInput.skills ?? profile.specialization ?? 'Not specified'}
Preferred Location: ${featureInput.location ?? state}
Duration Preference: ${featureInput.duration ?? 'Not specified'}
Stipend Requirement: ${featureInput.stipend ?? 'Not specified'}

Focus on:
- AICTE internship portal
- NATS (National Apprenticeship Training Scheme)
- Government and PSU internships
- Core sector internships matching the user's specialization
`.trim();

    case 'financial_literacy':
      return `
Task: Identify financial literacy resources and courses for this user.
Topics of Interest: ${featureInput.topics ?? 'General financial literacy'}
Preferred Level: ${featureInput.level ?? 'Beginner'}
Preferred Format: ${featureInput.format ?? 'Online'}

Focus on:
- RBI and SEBI official resources
- SWAYAM/NPTEL free courses
- NISM certification courses
- Investor education programs
- Savings and investment basics
`.trim();

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
          featureInput.state ?? state,
          featureInput.entranceExam,
          featureInput.collegeType && featureInput.collegeType !== 'Any' ? featureInput.collegeType : '',
          featureInput.budget && featureInput.budget !== 'No Preference' ? featureInput.budget : '',
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
          'education loan',
          featureInput.course ?? qual,
          featureInput.institution,
          'India bank',
          category ? `${category} subsidy` : '',
          '2024',
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

      case 'internship':
        return [
          'internship',
          featureInput.skills ?? spec,
          featureInput.location ?? state,
          'India 2024',
        ].filter(Boolean).join(' ');

      case 'financial_literacy':
        return [
          'financial literacy',
          featureInput.topics ?? 'investment savings',
          'India free course',
          featureInput.level ?? 'beginner',
        ].filter(Boolean).join(' ');

      default:
        return `${type} opportunities India 2024`;
    }
  },
};

export default PromptBuilder;
