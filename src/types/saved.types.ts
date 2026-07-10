// saved_items table - generic, supports all future opportunity types
export type SavedItemType =
  | 'college'
  | 'scholarship'
  | 'loan'
  | 'startup_funding'
  | 'financial_literacy'
  | 'mentor';

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: SavedItemType;
  item_id: string;
  item_title: string;
  item_metadata?: Record<string, unknown> | null;
  created_at: string;
}
