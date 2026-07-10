// search_history table
export type SearchCategory =
  | 'college'
  | 'scholarship'
  | 'loan'
  | 'government_scheme'
  | 'startup_funding'
  | 'financial_literacy'
  | 'mentor'
  | 'general';

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  category?: SearchCategory | null;
  filters?: Record<string, unknown> | null;
  results_count?: number | null;
  created_at: string;
}

// Generic opportunity type - extended by AI types in Phase 2
export interface Opportunity {
  id: string;
  title: string;
  description?: string | null;
  category: SearchCategory;
  source?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

// Preferred domains per feature — used by SearchService
export const PREFERRED_DOMAINS: Record<string, string[]> = {
  college: [
    'josaa.nic.in',
    'nta.ac.in',
    'csab.nic.in',
    'ugc.gov.in',
    'aicte-india.org',
    'nirfindia.org',
    'admissions.nic.in',
  ],
  scholarship: [
    'scholarships.gov.in',
    'aicte-india.org',
    'ugc.gov.in',
    'nsp.gov.in',
    'buddy4study.com',
  ],
  education_loan: [
    'vidyalakshmi.co.in',
    'sbi.co.in',
    'bankofbaroda.in',
    'pnbindia.in',
    'canarabank.com',
    'unionbankofindia.co.in',
  ],
  government_scheme: [
    'myscheme.gov.in',
    'india.gov.in',
    'wcd.nic.in',
    'mosje.gov.in',
    'tribal.gov.in',
  ],
  startup_funding: [
    'startupindia.gov.in',
    'sidbi.in',
    'msme.gov.in',
    'dpiit.gov.in',
    'incubator.startupindia.gov.in',
  ],
  financial_literacy: [
    'rbi.org.in',
    'sebi.gov.in',
    'nism.ac.in',
    'swayam.gov.in',
    'nptel.ac.in',
    'pfms.nic.in',
  ],
};
