import type { Profile } from './profile.types';
import type { StartupFundingRecommendation } from './ai.types';

// ── Form values ──────────────────────────────────────────────────────────────

export interface StartupFundingFormValues {
  startupName: string;
  startupIdea: string;
  industry: string;
  startupStage: string;
  fundingRequired: string;
  businessModel: string;
  startupRegistration: string;
  womenLed: string;
  currentRevenue: string;
  lookingFor: string[];
  preferredLocation: string;
  additionalPreferences: string[];
}

// ── Request / Response ───────────────────────────────────────────────────────

export interface StartupFundingSearchRequest {
  profile: Profile;
  formValues: StartupFundingFormValues;
}

export interface StartupFundingSearchResponse {
  results: StartupFundingRecommendation[];
  error: string | null;
  warning?: string | null;
  cached: boolean;
  searchDurationMs: number;
  query: string;
  totalFound: number;
}

// ── Dropdown / checkbox option lists ─────────────────────────────────────────

export const INDUSTRY_OPTIONS = [
  'Technology',
  'Artificial Intelligence',
  'Healthcare',
  'Education',
  'Agriculture',
  'FinTech',
  'ClimateTech',
  'Sustainability',
  'E-Commerce',
  'Food & Beverage',
  'Fashion',
  'Manufacturing',
  'Electronics',
  'Biotechnology',
  'Cybersecurity',
  'Social Enterprise',
  'Creative & Media',
  'Tourism',
  'Logistics',
  'Mobility',
  'Other',
] as const;

export const STARTUP_STAGE_OPTIONS = [
  'Idea Stage',
  'Prototype',
  'MVP',
  'Early Revenue',
  'Growth Stage',
  'Scaling',
  'Established',
] as const;

export const FUNDING_REQUIRED_OPTIONS = [
  'Below ₹1 Lakh',
  '₹1–5 Lakhs',
  '₹5–25 Lakhs',
  '₹25 Lakhs–₹1 Crore',
  '₹1–5 Crore',
  'Above ₹5 Crore',
] as const;

export const BUSINESS_MODEL_OPTIONS = [
  'B2B',
  'B2C',
  'D2C',
  'SaaS',
  'Marketplace',
  'Manufacturing',
  'Service',
  'Subscription',
  'NGO / Social Impact',
  'Other',
] as const;

export const STARTUP_REGISTRATION_OPTIONS = [
  'DPIIT Registered',
  'Startup India Registered',
  'MSME Registered',
  'Private Limited',
  'LLP',
  'Proprietorship',
  'Partnership',
  'Not Registered',
] as const;

export const WOMEN_LED_OPTIONS = [
  'Yes',
  'No',
  'Co-founded by Woman',
] as const;

export const CURRENT_REVENUE_OPTIONS = [
  'Pre-Revenue',
  'Below ₹5 Lakhs',
  '₹5–25 Lakhs',
  '₹25 Lakhs–₹1 Crore',
  'Above ₹1 Crore',
] as const;

export const LOOKING_FOR_OPTIONS = [
  'Grants',
  'Seed Funding',
  'Angel Investors',
  'Venture Capital',
  'Incubators',
  'Accelerators',
  'Government Schemes',
  'CSR Funding',
  'Pitch Competitions',
  'Startup Challenges',
  'University Incubation',
  'Corporate Innovation Programs',
  'Private Schemes',
  'Investments',
] as const;

export const PREFERRED_LOCATION_OPTIONS = [
  'Anywhere in India',
  ...([
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
  ] as const),
  'International Opportunities',
] as const;

export const ADDITIONAL_PREFERENCES_OPTIONS = [
  'Women-only opportunities',
  'Government-backed only',
  'No equity funding',
  'Remote application available',
  'Currently accepting applications',
] as const;

// ── Form defaults ─────────────────────────────────────────────────────────────

export const STARTUP_FUNDING_FORM_DEFAULTS: StartupFundingFormValues = {
  startupName: '',
  startupIdea: '',
  industry: '',
  startupStage: '',
  fundingRequired: '',
  businessModel: '',
  startupRegistration: '',
  womenLed: '',
  currentRevenue: '',
  lookingFor: [],
  preferredLocation: 'Anywhere in India',
  additionalPreferences: [],
};
