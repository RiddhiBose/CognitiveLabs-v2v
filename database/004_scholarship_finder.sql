-- ElevateHer AI: Scholarship Finder — Incremental Schema Update
-- Run this file in the Supabase SQL Editor AFTER 001_initial_schema.sql.
-- Do NOT modify 001_initial_schema.sql.
--
-- Changes in this migration:
--   1. Adds a JSONB `filters` column to search_history (if not already present).
--      The initial schema stored only `query`, `category`, and `results_count`.
--      The Scholarship Finder stores structured filter metadata (field,
--      amount, deadline, location, gender) inside this column.
--
--   2. Adds a partial index on search_history for faster scholarship-category lookups.
--
-- All other tables (saved_items, profiles, etc.) already support the
-- Scholarship Finder without modification:
--   • saved_items.item_type already includes 'scholarship' in its CHECK constraint.
--   • search_history.category already includes 'scholarship' in its CHECK constraint.
-- ─────────────────────────────────────────────────────────────────────────────


-- 1. Add `filters` JSONB column to search_history (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'search_history'
      AND column_name  = 'filters'
  ) THEN
    ALTER TABLE public.search_history
      ADD COLUMN filters JSONB;

    COMMENT ON COLUMN public.search_history.filters IS
      'Feature-specific search filters stored as JSON. '
      'For scholarship searches: { field, amount, deadline, location, gender, educationLevel }';
  END IF;
END $$;


-- 2. Partial index for fast per-user scholarship search history queries
CREATE INDEX IF NOT EXISTS search_history_scholarship_user_idx
  ON public.search_history (user_id, created_at DESC)
  WHERE category = 'scholarship';


-- 3. Partial index for fast per-user saved scholarship lookups
CREATE INDEX IF NOT EXISTS saved_items_scholarship_user_idx
  ON public.saved_items (user_id, created_at DESC)
  WHERE item_type = 'scholarship';
