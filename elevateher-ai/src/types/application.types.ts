// applications table - generic for all application types
export type ApplicationType =
  | 'college'
  | 'scholarship'
  | 'loan'
  | 'internship'
  | 'startup_funding'
  | 'government_scheme';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  user_id: string;
  application_type: ApplicationType;
  opportunity_id: string;
  opportunity_title: string;
  status: ApplicationStatus;
  notes?: string | null;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

// application_documents table
export type DocumentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected';

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_name: string;
  document_url?: string | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}
