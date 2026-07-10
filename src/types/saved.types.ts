// saved_items table — universal saved recommendations

export type SavedItemType =
  | 'college'
  | 'scholarship'
  | 'loan'
  | 'government_scheme'
  | 'startup_funding'
  | 'financial_literacy'
  | 'financial-literacy'
  | 'financial-literacy-course'
  | 'mentor';

// Human-readable labels for filter UI
export const SAVED_TYPE_LABELS: Record<SavedItemType, string> = {
  college: 'Colleges',
  scholarship: 'Scholarships',
  loan: 'Education Loans',
  government_scheme: 'Govt. Schemes',
  startup_funding: 'Startup Funding',
  financial_literacy: 'Financial Literacy',
  'financial-literacy': 'Financial Literacy',
  'financial-literacy-course': 'Financial Literacy',
  mentor: 'Mentors',
};

// Canonical display type (collapses hyphen variants)
export function canonicalType(t: SavedItemType): string {
  if (t === 'financial-literacy' || t === 'financial-literacy-course') return 'financial_literacy';
  return t;
}

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: SavedItemType;
  item_id: string;
  item_title: string;
  item_metadata: Record<string, unknown> | null;
  /** Full recommendation snapshot stored at save time */
  recommendation_snapshot: Record<string, unknown> | null;
  source_url?: string | null;
  official_website?: string | null;
  last_checked_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Input shape used by SavedItemsService.save()
export interface SaveInput {
  userId: string;
  itemType: SavedItemType;
  itemId: string;
  itemTitle: string;
  itemMetadata?: Record<string, unknown>;
  /** Pass the full recommendation object — it will be JSON-serialised */
  snapshot?: Record<string, unknown>;
}
