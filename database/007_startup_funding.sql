-- ============================================================
-- ElevateHer AI — Phase 3: Startup Funding Finder
-- Incremental schema update
--
-- Run this file in the Supabase SQL Editor AFTER
-- 001_initial_schema.sql has been applied.
--
-- The initial schema (001) already includes:
--   • saved_items        — item_type CHECK includes 'startup_funding'
--   • search_history     — category + filters JSONB support this feature
--   • applications       — application_type CHECK includes 'startup_funding'
--
-- This file adds only:
--   1. Performance indexes for the new query patterns
--   2. A convenience view for startup funding search history
-- ============================================================


-- ── 1. Indexes ───────────────────────────────────────────────────────────────

-- Fast lookup of all saved startup funding items for a user
CREATE INDEX IF NOT EXISTS saved_items_startup_funding_idx
  ON public.saved_items (user_id, item_type)
  WHERE item_type = 'startup_funding';

-- Fast lookup of startup funding search history for a user
CREATE INDEX IF NOT EXISTS search_history_startup_funding_idx
  ON public.search_history (user_id, category, created_at DESC)
  WHERE category = 'startup_funding';


-- ── 2. Convenience view: startup_funding_search_history ──────────────────────
-- Returns a user's startup funding searches with key filter fields
-- extracted from the JSONB filters column for easier querying.

CREATE OR REPLACE VIEW public.startup_funding_search_history AS
SELECT
  sh.id,
  sh.user_id,
  sh.query,
  sh.results_count,
  sh.created_at,
  sh.filters->>'industry'           AS industry,
  sh.filters->>'startupStage'       AS startup_stage,
  sh.filters->>'fundingRequired'    AS funding_required,
  sh.filters->>'preferredLocation'  AS preferred_location,
  sh.filters->>'womenLed'           AS women_led,
  sh.filters->>'businessModel'      AS business_model,
  sh.filters->>'startupRegistration' AS startup_registration,
  sh.filters->>'currentRevenue'     AS current_revenue
FROM public.search_history sh
WHERE sh.category = 'startup_funding';


-- ── 3. RLS on the view ────────────────────────────────────────────────────────
-- Views in Postgres inherit RLS from their underlying tables,
-- but we add an explicit security invoker comment for clarity.

COMMENT ON VIEW public.startup_funding_search_history IS
  'Convenience view over search_history for startup_funding category. '
  'Inherits RLS from the search_history table (users see only their own rows).';
