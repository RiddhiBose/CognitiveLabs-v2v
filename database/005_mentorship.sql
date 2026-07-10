-- ElevateHer AI: Mentorship & Intelligent Matching Module
-- Incremental migration — run AFTER 001_initial_schema.sql through 004_scholarship_finder.sql
-- Run this file in the Supabase SQL Editor.
-- Do NOT modify previous migration files.
-- Do NOT drop existing tables.
--
-- Changes in this migration:
--   1. learner_preferences  — stores a learner's mentor-search preferences (shown once)
--   2. mentor_preferences   — stores a mentor's preferred learner profile (shown once)
--   3. mentorship_connections — active connections after a request is accepted
--   4. Additional indexes on profiles for mentorship filtering
--   5. Notification type extension for mentorship_connection
--   6. RLS policies for all new tables
-- ─────────────────────────────────────────────────────────────────────────────


-- ── TABLE: learner_preferences ─────────────────────────────────────────────
-- One row per learner. Created or updated the first time they visit Mentorship.

CREATE TABLE IF NOT EXISTS public.learner_preferences (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                   UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preferred mentor attributes
  preferred_occupation      TEXT,                   -- e.g. 'Software Engineer', 'Professor'
  preferred_job_role        TEXT,                   -- e.g. 'Full Stack Developer'
  preferred_degree          TEXT,                   -- e.g. 'B.Tech', 'M.Tech'
  preferred_branch          TEXT,                   -- e.g. 'CSE', 'AI & ML'
  preferred_min_experience  INTEGER DEFAULT 0,      -- minimum years of experience

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS learner_prefs_user_id_idx
  ON public.learner_preferences (user_id);

DROP TRIGGER IF EXISTS learner_preferences_updated_at ON public.learner_preferences;
CREATE TRIGGER learner_preferences_updated_at
  BEFORE UPDATE ON public.learner_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.learner_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learner_prefs_select_own"  ON public.learner_preferences;
DROP POLICY IF EXISTS "learner_prefs_insert_own"  ON public.learner_preferences;
DROP POLICY IF EXISTS "learner_prefs_update_own"  ON public.learner_preferences;
DROP POLICY IF EXISTS "learner_prefs_delete_own"  ON public.learner_preferences;

CREATE POLICY "learner_prefs_select_own"
  ON public.learner_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "learner_prefs_insert_own"
  ON public.learner_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "learner_prefs_update_own"
  ON public.learner_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "learner_prefs_delete_own"
  ON public.learner_preferences FOR DELETE
  USING (auth.uid() = user_id);


-- ── TABLE: mentor_preferences ──────────────────────────────────────────────
-- One row per mentor. Created or updated the first time they visit Mentorship.

CREATE TABLE IF NOT EXISTS public.mentor_preferences (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preferred learner attributes
  preferred_learner_occupation  TEXT,               -- e.g. 'Undergraduate', 'School Student'
  preferred_learner_age_min     INTEGER,            -- minimum preferred learner age
  preferred_learner_age_max     INTEGER,            -- maximum preferred learner age
  preferred_degree              TEXT,               -- preferred learner degree
  preferred_branch              TEXT,               -- preferred learner branch
  max_active_mentees            INTEGER DEFAULT 5,  -- cap on simultaneous mentees
  preferred_language            TEXT DEFAULT 'English', -- communication language

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mentor_prefs_user_id_idx
  ON public.mentor_preferences (user_id);

DROP TRIGGER IF EXISTS mentor_preferences_updated_at ON public.mentor_preferences;
CREATE TRIGGER mentor_preferences_updated_at
  BEFORE UPDATE ON public.mentor_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.mentor_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentor_prefs_select_authenticated" ON public.mentor_preferences;
DROP POLICY IF EXISTS "mentor_prefs_insert_own"           ON public.mentor_preferences;
DROP POLICY IF EXISTS "mentor_prefs_update_own"           ON public.mentor_preferences;
DROP POLICY IF EXISTS "mentor_prefs_delete_own"           ON public.mentor_preferences;

-- Mentors' preferences are readable by all authenticated users
-- (learners can see what a mentor is looking for on their profile page)
CREATE POLICY "mentor_prefs_select_authenticated"
  ON public.mentor_preferences FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "mentor_prefs_insert_own"
  ON public.mentor_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mentor_prefs_update_own"
  ON public.mentor_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mentor_prefs_delete_own"
  ON public.mentor_preferences FOR DELETE
  USING (auth.uid() = user_id);


-- ── TABLE: mentorship_connections ──────────────────────────────────────────
-- Created when a mentor ACCEPTS a mentorship request.
-- Designed to support future: chat, scheduling, ratings, resource sharing.

CREATE TABLE IF NOT EXISTS public.mentorship_connections (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id        UUID NOT NULL UNIQUE REFERENCES public.mentorship_requests(id) ON DELETE CASCADE,
  mentor_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                      'active', 'paused', 'completed', 'terminated'
                    )),

  -- Future-ready columns (nullable, populated by later phases)
  chat_room_id      TEXT,                   -- Phase: In-app Chat
  next_session_at   TIMESTAMPTZ,            -- Phase: Calendar Scheduling
  learning_roadmap  JSONB,                  -- Phase: AI Learning Roadmaps
  mentor_rating     NUMERIC(3,2),           -- Phase: Mentor Ratings (0–5)
  mentor_review     TEXT,                   -- Phase: Mentor Review
  resources         JSONB,                  -- Phase: Resource Sharing

  connected_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (mentor_id, learner_id)
);

CREATE INDEX IF NOT EXISTS connections_mentor_id_idx
  ON public.mentorship_connections (mentor_id);

CREATE INDEX IF NOT EXISTS connections_learner_id_idx
  ON public.mentorship_connections (learner_id);

CREATE INDEX IF NOT EXISTS connections_status_idx
  ON public.mentorship_connections (status);

DROP TRIGGER IF EXISTS mentorship_connections_updated_at ON public.mentorship_connections;
CREATE TRIGGER mentorship_connections_updated_at
  BEFORE UPDATE ON public.mentorship_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.mentorship_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connections_select"  ON public.mentorship_connections;
DROP POLICY IF EXISTS "connections_insert"  ON public.mentorship_connections;
DROP POLICY IF EXISTS "connections_update"  ON public.mentorship_connections;
DROP POLICY IF EXISTS "connections_delete"  ON public.mentorship_connections;

CREATE POLICY "connections_select"
  ON public.mentorship_connections FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);

CREATE POLICY "connections_insert"
  ON public.mentorship_connections FOR INSERT
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "connections_update"
  ON public.mentorship_connections FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);

CREATE POLICY "connections_delete"
  ON public.mentorship_connections FOR DELETE
  USING (auth.uid() = mentor_id);


-- ── Additional indexes on profiles for fast mentorship filtering ───────────

CREATE INDEX IF NOT EXISTS profiles_qualification_idx
  ON public.profiles (qualification);

CREATE INDEX IF NOT EXISTS profiles_specialization_idx
  ON public.profiles (specialization);

CREATE INDEX IF NOT EXISTS profiles_experience_idx
  ON public.profiles (experience);

CREATE INDEX IF NOT EXISTS profiles_company_idx
  ON public.profiles (company);

CREATE INDEX IF NOT EXISTS profiles_role_state_idx
  ON public.profiles (role, state);

CREATE INDEX IF NOT EXISTS profiles_role_experience_idx
  ON public.profiles (role, experience);


-- ── Extend notification CHECK constraint to include mentorship_connection ──
-- The initial schema already has: mentorship_request, mentorship_accepted, mentorship_rejected
-- We add mentorship_connection for connection-established events.

DO $$
BEGIN
  -- Drop old constraint if it exists, then re-add with extended values.
  -- This is safe because the constraint is only a CHECK, not a FK.
  ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

  ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'mentorship_request',
      'mentorship_accepted',
      'mentorship_rejected',
      'mentorship_connection',
      'application_update',
      'system',
      'general'
    ));
EXCEPTION
  WHEN OTHERS THEN
    -- If constraint manipulation fails (e.g. already updated), continue silently
    NULL;
END $$;


-- ── Partial indexes for fast per-user mentorship request lookups ───────────

CREATE INDEX IF NOT EXISTS mentorship_requests_pending_mentor_idx
  ON public.mentorship_requests (mentor_id, requested_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS mentorship_requests_accepted_idx
  ON public.mentorship_requests (learner_id, requested_at DESC)
  WHERE status = 'accepted';
