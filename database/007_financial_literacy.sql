-- ElevateHer AI: Financial Literacy Module — Incremental Schema
-- Run this file in the Supabase SQL Editor AFTER 006_college_school_chat.sql.
-- Do NOT modify any previous migration files.
-- Do NOT drop existing tables.
--
-- What this migration covers:
--
--   1. Fix search_history.category CHECK constraint
--      The service inserts category = 'financial-literacy' (hyphen).
--      The initial schema only allowed 'financial_literacy' (underscore).
--      Both values are accepted after this migration.
--
--   2. Fix saved_items.item_type CHECK constraint
--      The service inserts item_type = 'financial-literacy-course'.
--      The initial schema only allowed 'financial_literacy' (underscore, no suffix).
--      Both values are accepted after this migration.
--
--   3. TABLE: financial_literacy_courses
--      Persistent catalogue of AI-recommended courses that have been surfaced
--      at least once. Acts as a local cache/reference so the same course data
--      can be reused across saved_items, search history, and future features
--      (ratings, reviews, enrolment tracking) without re-fetching from the AI.
--
--   4. TABLE: financial_literacy_enrollments
--      Tracks a user's enrolment or progress against a specific course.
--      Ready for future phases: progress %, completion certificates, badges.
--
--   5. Partial indexes for fast per-user financial literacy lookups on
--      search_history and saved_items.
--
--   6. JSONB index on saved_items.item_metadata for fast provider/topic lookups.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Extend search_history.category CHECK ───────────────────────────────
-- The initial schema CHECK only included 'financial_literacy' (underscore).
-- FinancialLiteracyService.ts inserts 'financial-literacy' (hyphen).
-- We drop the old constraint and recreate it with both values accepted.

DO $$
BEGIN
  ALTER TABLE public.search_history
    DROP CONSTRAINT IF EXISTS search_history_category_check;

  ALTER TABLE public.search_history
    ADD CONSTRAINT search_history_category_check
    CHECK (category IN (
      'college',
      'scholarship',
      'loan',
      'government_scheme',
      'startup_funding',
      'financial_literacy',
      'financial-literacy',
      'mentor',
      'general'
    ));
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- silently continue if constraint already matches
END $$;


-- ── 2. Extend saved_items.item_type CHECK ─────────────────────────────────
-- The initial schema CHECK included 'financial_literacy' but not
-- 'financial-literacy-course' which is what FinancialLiteracyService.ts uses.

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
      'financial-literacy-course',
      'mentor'
    ));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;


-- ── 3. TABLE: financial_literacy_courses ─────────────────────────────────
-- Persistent catalogue of courses surfaced by the AI.
-- Deduplication key: (provider, title) — same course from the same provider
-- is stored once regardless of how many users have seen it.

CREATE TABLE IF NOT EXISTS public.financial_literacy_courses (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core identity
  title            TEXT NOT NULL,
  provider         TEXT,                   -- e.g. 'NISM', 'NPTEL', 'Coursera'
  topic            TEXT,                   -- e.g. 'Mutual Funds', 'Stock Market'
  summary          TEXT,

  -- Classification
  level            TEXT CHECK (level IN (
                     'Beginner', 'Intermediate', 'Advanced', 'Any', NULL
                   )),
  duration         TEXT,                   -- e.g. '4 weeks', '10 hours'
  is_free          BOOLEAN,
  language         TEXT,

  -- Links
  official_website TEXT,
  enrollment_link  TEXT,
  source_url       TEXT,

  -- AI match metadata (from the most recent AI recommendation)
  match_score      INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  reason           TEXT,

  -- Provider flags (quick filter without string matching)
  is_nism_course   BOOLEAN NOT NULL DEFAULT FALSE,  -- true when provider = NISM
  is_government    BOOLEAN NOT NULL DEFAULT FALSE,  -- NPTEL, SWAYAM, RBI, SEBI etc.

  -- Full AI-returned metadata stored for extensibility
  metadata         JSONB,

  -- Timestamps
  first_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per unique course per provider
  UNIQUE (provider, title)
);

COMMENT ON TABLE public.financial_literacy_courses IS
  'Persistent catalogue of AI-recommended financial literacy courses. '
  'Populated automatically when courses are returned by the AI. '
  'Reused by saved_items, enrollments, and future ratings/reviews.';

COMMENT ON COLUMN public.financial_literacy_courses.is_nism_course IS
  'Set TRUE when provider contains "NISM" or source URL is on nism.ac.in. '
  'Used to apply NISM-specific enrolment link logic in the UI.';

-- Performance indexes
CREATE INDEX IF NOT EXISTS fl_courses_provider_idx
  ON public.financial_literacy_courses (provider);

CREATE INDEX IF NOT EXISTS fl_courses_topic_idx
  ON public.financial_literacy_courses (topic);

CREATE INDEX IF NOT EXISTS fl_courses_is_nism_idx
  ON public.financial_literacy_courses (is_nism_course)
  WHERE is_nism_course = TRUE;

CREATE INDEX IF NOT EXISTS fl_courses_is_free_idx
  ON public.financial_literacy_courses (is_free);

CREATE INDEX IF NOT EXISTS fl_courses_level_idx
  ON public.financial_literacy_courses (level);

CREATE INDEX IF NOT EXISTS fl_courses_last_seen_idx
  ON public.financial_literacy_courses (last_seen_at DESC);

-- GIN index for fast JSONB metadata searches (future: topic tags, skills)
CREATE INDEX IF NOT EXISTS fl_courses_metadata_gin_idx
  ON public.financial_literacy_courses USING GIN (metadata);

DROP TRIGGER IF EXISTS fl_courses_updated_at ON public.financial_literacy_courses;
CREATE TRIGGER fl_courses_updated_at
  BEFORE UPDATE ON public.financial_literacy_courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS: all authenticated users can read the course catalogue;
--      only the service role (server-side) inserts/updates/deletes.
ALTER TABLE public.financial_literacy_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fl_courses_select_authenticated" ON public.financial_literacy_courses;
CREATE POLICY "fl_courses_select_authenticated"
  ON public.financial_literacy_courses FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT / UPDATE allowed from authenticated context (service inserts on behalf of user)
DROP POLICY IF EXISTS "fl_courses_insert_authenticated" ON public.financial_literacy_courses;
CREATE POLICY "fl_courses_insert_authenticated"
  ON public.financial_literacy_courses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "fl_courses_update_authenticated" ON public.financial_literacy_courses;
CREATE POLICY "fl_courses_update_authenticated"
  ON public.financial_literacy_courses FOR UPDATE
  USING (auth.role() = 'authenticated');


-- ── 4. TABLE: financial_literacy_enrollments ─────────────────────────────
-- Tracks each user's enrolment status against a course.
-- Currently stores intent-to-enrol + completion; ready for progress tracking.

CREATE TABLE IF NOT EXISTS public.financial_literacy_enrollments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link to the course catalogue (nullable FK — course may not yet be catalogued)
  course_id     UUID REFERENCES public.financial_literacy_courses(id) ON DELETE SET NULL,

  -- Denormalised fallback in case course_id is NULL
  course_title  TEXT NOT NULL,
  provider      TEXT,

  -- Enrolment lifecycle
  status        TEXT NOT NULL DEFAULT 'interested' CHECK (status IN (
                  'interested',    -- user clicked Enrol / Apply
                  'enrolled',      -- user confirmed enrolment on the platform
                  'in_progress',   -- actively taking the course
                  'completed',     -- finished the course
                  'dropped'        -- stopped before completion
                )),

  -- Progress (populated in future phases)
  progress_pct  INTEGER CHECK (progress_pct >= 0 AND progress_pct <= 100),
  completed_at  TIMESTAMPTZ,
  certificate_url TEXT,            -- link to certificate if issued

  -- Notes / reminder
  notes         TEXT,

  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active enrolment per user per course title
  UNIQUE (user_id, course_title)
);

COMMENT ON TABLE public.financial_literacy_enrollments IS
  'Tracks user enrolments and progress for financial literacy courses. '
  'Currently stores intent-to-enrol; progress_pct and certificate_url '
  'are populated in future phases.';

CREATE INDEX IF NOT EXISTS fl_enrollments_user_id_idx
  ON public.financial_literacy_enrollments (user_id);

CREATE INDEX IF NOT EXISTS fl_enrollments_course_id_idx
  ON public.financial_literacy_enrollments (course_id)
  WHERE course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS fl_enrollments_status_idx
  ON public.financial_literacy_enrollments (user_id, status);

DROP TRIGGER IF EXISTS fl_enrollments_updated_at ON public.financial_literacy_enrollments;
CREATE TRIGGER fl_enrollments_updated_at
  BEFORE UPDATE ON public.financial_literacy_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.financial_literacy_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fl_enrollments_select_own" ON public.financial_literacy_enrollments;
DROP POLICY IF EXISTS "fl_enrollments_insert_own" ON public.financial_literacy_enrollments;
DROP POLICY IF EXISTS "fl_enrollments_update_own" ON public.financial_literacy_enrollments;
DROP POLICY IF EXISTS "fl_enrollments_delete_own" ON public.financial_literacy_enrollments;

CREATE POLICY "fl_enrollments_select_own"
  ON public.financial_literacy_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "fl_enrollments_insert_own"
  ON public.financial_literacy_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fl_enrollments_update_own"
  ON public.financial_literacy_enrollments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fl_enrollments_delete_own"
  ON public.financial_literacy_enrollments FOR DELETE
  USING (auth.uid() = user_id);


-- ── 5. Partial indexes for fast per-user financial literacy queries ────────

-- search_history: fast lookups for both hyphen and underscore category values
CREATE INDEX IF NOT EXISTS search_history_fl_hyphen_idx
  ON public.search_history (user_id, created_at DESC)
  WHERE category = 'financial-literacy';

CREATE INDEX IF NOT EXISTS search_history_fl_underscore_idx
  ON public.search_history (user_id, created_at DESC)
  WHERE category = 'financial_literacy';

-- saved_items: fast lookup for saved financial literacy courses
CREATE INDEX IF NOT EXISTS saved_items_fl_course_user_idx
  ON public.saved_items (user_id, created_at DESC)
  WHERE item_type = 'financial-literacy-course';

CREATE INDEX IF NOT EXISTS saved_items_fl_user_idx
  ON public.saved_items (user_id, created_at DESC)
  WHERE item_type = 'financial_literacy';


-- ── 6. JSONB index on saved_items.item_metadata ───────────────────────────
-- Enables fast queries like: find all saved NISM courses, find free courses, etc.

CREATE INDEX IF NOT EXISTS saved_items_metadata_gin_idx
  ON public.saved_items USING GIN (item_metadata)
  WHERE item_metadata IS NOT NULL;
