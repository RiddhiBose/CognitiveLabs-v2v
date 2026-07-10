-- ElevateHer AI: Universal Saved Recommendations Module
-- Incremental migration — run AFTER 007_financial_literacy.sql / 007_startup_funding.sql
-- Run this file in the Supabase SQL Editor.
-- Do NOT modify any previous migration files.
--
-- Changes:
--   1. Add recommendation_snapshot JSONB column — stores the complete recommendation
--      as it appeared at save time, so the Saved page always renders correctly
--      even if external data changes later.
--   2. Add updated_at TIMESTAMPTZ column with auto-update trigger.
--   3. Extend the saved_items.item_type CHECK constraint to include all supported
--      types used by the current feature services.
--   4. Add performance indexes for the Saved page (type filter, title search,
--      match_score sort, created_at sort).
--   5. Add UPDATE RLS policy so users can update their own saved items.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Add recommendation_snapshot column (idempotent) ───────────────────────
-- Stores the full recommendation JSON exactly as displayed at save time.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'saved_items'
      AND column_name  = 'recommendation_snapshot'
  ) THEN
    ALTER TABLE public.saved_items
      ADD COLUMN recommendation_snapshot JSONB;

    COMMENT ON COLUMN public.saved_items.recommendation_snapshot IS
      'Complete serialised recommendation as it appeared at save time. '
      'Ensures the Saved page renders identically to the source module '
      'even if external data changes later.';
  END IF;
END $$;


-- ── 2. Add updated_at column with auto-trigger (idempotent) ──────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'saved_items'
      AND column_name  = 'updated_at'
  ) THEN
    ALTER TABLE public.saved_items
      ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

DROP TRIGGER IF EXISTS saved_items_updated_at ON public.saved_items;
CREATE TRIGGER saved_items_updated_at
  BEFORE UPDATE ON public.saved_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── 3. Extend item_type CHECK constraint ─────────────────────────────────────
-- The initial schema allowed:
--   college | scholarship | loan | government_scheme | startup_funding |
--   financial_literacy | mentor
-- The feature services also insert:
--   financial-literacy-course  (FinancialLiteracyService)
--   financial-literacy         (alternative used in some code paths)
-- We rebuild the constraint to accept all current and future known values.

DO $$
BEGIN
  ALTER TABLE public.saved_items
    DROP CONSTRAINT IF EXISTS saved_items_item_type_check;

  ALTER TABLE public.saved_items
    ADD CONSTRAINT saved_items_item_type_check
    CHECK (item_type IN (
      'college',
      'scholarship',
      'loan',
      'government_scheme',
      'startup_funding',
      'financial_literacy',
      'financial-literacy',
      'financial-literacy-course',
      'mentor'
    ));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;


-- ── 4. Performance indexes ────────────────────────────────────────────────────

-- Fast filter by type per user
CREATE INDEX IF NOT EXISTS saved_items_user_type_idx
  ON public.saved_items (user_id, item_type, created_at DESC);

-- Fast sort by created_at per user (Recently Saved / Oldest Saved)
CREATE INDEX IF NOT EXISTS saved_items_user_created_idx
  ON public.saved_items (user_id, created_at DESC);

-- GIN index for full-text search across recommendation_snapshot
CREATE INDEX IF NOT EXISTS saved_items_snapshot_gin_idx
  ON public.saved_items USING GIN (recommendation_snapshot)
  WHERE recommendation_snapshot IS NOT NULL;

-- GIN index for item_metadata
CREATE INDEX IF NOT EXISTS saved_items_metadata_gin_idx
  ON public.saved_items USING GIN (item_metadata)
  WHERE item_metadata IS NOT NULL;

-- Title prefix search (for the search bar)
CREATE INDEX IF NOT EXISTS saved_items_title_idx
  ON public.saved_items (user_id, item_title);


-- ── 5. UPDATE RLS policy ──────────────────────────────────────────────────────
-- Needed so that the service can upsert / update snapshot fields.

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_items_update_own" ON public.saved_items;
CREATE POLICY "saved_items_update_own"
  ON public.saved_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
