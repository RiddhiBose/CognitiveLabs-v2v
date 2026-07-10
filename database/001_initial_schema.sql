-- ElevateHer AI: Initial Database Schema
-- Run this entire file in the Supabase SQL Editor.
-- Do NOT execute via CLI or automatically.

-- FUNCTION: auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL,
  email                TEXT NOT NULL,
  age                  INTEGER CHECK (age >= 13 AND age <= 100),
  gender               TEXT CHECK (gender IN ('female', 'male', 'non_binary', 'prefer_not_to_say', 'other')),
  qualification        TEXT CHECK (qualification IN (
                         'class_10','class_12','diploma','iti',
                         'ba','bsc','bcom','bba','bca','btech','be',
                         'mbbs','bds','bpharm','llb',
                         'mba','mca','mtech','msc','ma','mcom','phd','other'
                       )),
  qualification_other  TEXT,
  specialization       TEXT,
  specialization_other TEXT,
  occupation           TEXT CHECK (occupation IN (
                         'student','working_professional','entrepreneur',
                         'government_employee','private_employee',
                         'research_scholar','freelancer','homemaker',
                         'job_seeker','other'
                       )),
  occupation_other     TEXT,
  experience           INTEGER CHECK (experience >= 0),
  job_title            TEXT,
  company              TEXT,
  industry             TEXT,
  employment_type      TEXT CHECK (employment_type IN (
                         'government','private','startup',
                         'self_employed','ngo','freelancer','other'
                       )),
  annual_income        TEXT CHECK (annual_income IN (
                         'below_2l','2l_5l','5l_8l','8l_12l','12l_20l','above_20l'
                       )),
  category             TEXT CHECK (category IN (
                         'general','obc','sc','st','ews','prefer_not_to_say'
                       )),
  pwd_status           TEXT CHECK (pwd_status IN ('yes','no')),
  state                TEXT,
  city                 TEXT,
  bio                  TEXT,
  role                 TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','mentor')),
  avatar_url           TEXT,
  is_profile_complete  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_user_id_idx   ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx       ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_state_idx      ON public.profiles (state);
CREATE INDEX IF NOT EXISTS profiles_occupation_idx ON public.profiles (occupation);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"           ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own"            ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);


-- TABLE: mentors
-- Auto-created when a user's role is set to 'mentor'
CREATE TABLE IF NOT EXISTS public.mentors (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  experience   INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
  industry     TEXT,
  company      TEXT,
  bio          TEXT,
  availability TEXT,
  skills       TEXT[],
  rating       NUMERIC(3,2) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mentors_user_id_idx  ON public.mentors (user_id);
CREATE INDEX IF NOT EXISTS mentors_rating_idx   ON public.mentors (rating DESC);
CREATE INDEX IF NOT EXISTS mentors_industry_idx ON public.mentors (industry);

DROP TRIGGER IF EXISTS mentors_updated_at ON public.mentors;
CREATE TRIGGER mentors_updated_at
  BEFORE UPDATE ON public.mentors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentors_select_authenticated" ON public.mentors;
DROP POLICY IF EXISTS "mentors_insert_own"           ON public.mentors;
DROP POLICY IF EXISTS "mentors_update_own"           ON public.mentors;
DROP POLICY IF EXISTS "mentors_delete_own"           ON public.mentors;

CREATE POLICY "mentors_select_authenticated"
  ON public.mentors FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "mentors_insert_own"
  ON public.mentors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mentors_update_own"
  ON public.mentors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mentors_delete_own"
  ON public.mentors FOR DELETE
  USING (auth.uid() = user_id);


-- TABLE: saved_items
-- Generic table reused by all future opportunity types
CREATE TABLE IF NOT EXISTS public.saved_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type     TEXT NOT NULL CHECK (item_type IN (
                  'college','scholarship','loan','government_scheme',
                  'startup_funding','financial_literacy','mentor'
                )),
  item_id       TEXT NOT NULL,
  item_title    TEXT NOT NULL,
  item_metadata JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS saved_items_user_id_idx   ON public.saved_items (user_id);
CREATE INDEX IF NOT EXISTS saved_items_item_type_idx ON public.saved_items (item_type);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_items_select_own" ON public.saved_items;
DROP POLICY IF EXISTS "saved_items_insert_own" ON public.saved_items;
DROP POLICY IF EXISTS "saved_items_delete_own" ON public.saved_items;

CREATE POLICY "saved_items_select_own"
  ON public.saved_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_items_insert_own"
  ON public.saved_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_items_delete_own"
  ON public.saved_items FOR DELETE
  USING (auth.uid() = user_id);


-- TABLE: applications
-- Generic tracker for all future application types
CREATE TABLE IF NOT EXISTS public.applications (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_type  TEXT NOT NULL CHECK (application_type IN (
                      'college','scholarship','loan',
                      'startup_funding','government_scheme'
                    )),
  opportunity_id    TEXT NOT NULL,
  opportunity_title TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                      'draft','submitted','under_review',
                      'approved','rejected','withdrawn'
                    )),
  notes             TEXT,
  submitted_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS applications_user_id_idx ON public.applications (user_id);
CREATE INDEX IF NOT EXISTS applications_status_idx  ON public.applications (status);
CREATE INDEX IF NOT EXISTS applications_type_idx    ON public.applications (application_type);

DROP TRIGGER IF EXISTS applications_updated_at ON public.applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_select_own" ON public.applications;
DROP POLICY IF EXISTS "applications_insert_own" ON public.applications;
DROP POLICY IF EXISTS "applications_update_own" ON public.applications;
DROP POLICY IF EXISTS "applications_delete_own" ON public.applications;

CREATE POLICY "applications_select_own"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "applications_insert_own"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_update_own"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_delete_own"
  ON public.applications FOR DELETE
  USING (auth.uid() = user_id);


-- TABLE: application_documents
CREATE TABLE IF NOT EXISTS public.application_documents (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_name  TEXT NOT NULL,
  document_url   TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                   'pending','uploaded','verified','rejected'
                 )),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_docs_application_id_idx ON public.application_documents (application_id);

DROP TRIGGER IF EXISTS application_documents_updated_at ON public.application_documents;
CREATE TRIGGER application_documents_updated_at
  BEFORE UPDATE ON public.application_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_docs_select_own" ON public.application_documents;
DROP POLICY IF EXISTS "app_docs_insert_own" ON public.application_documents;
DROP POLICY IF EXISTS "app_docs_update_own" ON public.application_documents;
DROP POLICY IF EXISTS "app_docs_delete_own" ON public.application_documents;

CREATE POLICY "app_docs_select_own"
  ON public.application_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "app_docs_insert_own"
  ON public.application_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "app_docs_update_own"
  ON public.application_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "app_docs_delete_own"
  ON public.application_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );


-- TABLE: mentorship_requests
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                 'pending','accepted','rejected','cancelled','completed'
               )),
  message      TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mentor_id, learner_id)
);

CREATE INDEX IF NOT EXISTS mentorship_requests_mentor_id_idx  ON public.mentorship_requests (mentor_id);
CREATE INDEX IF NOT EXISTS mentorship_requests_learner_id_idx ON public.mentorship_requests (learner_id);
CREATE INDEX IF NOT EXISTS mentorship_requests_status_idx     ON public.mentorship_requests (status);

DROP TRIGGER IF EXISTS mentorship_requests_updated_at ON public.mentorship_requests;
CREATE TRIGGER mentorship_requests_updated_at
  BEFORE UPDATE ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentorship_requests_select" ON public.mentorship_requests;
DROP POLICY IF EXISTS "mentorship_requests_insert" ON public.mentorship_requests;
DROP POLICY IF EXISTS "mentorship_requests_update" ON public.mentorship_requests;
DROP POLICY IF EXISTS "mentorship_requests_delete" ON public.mentorship_requests;

CREATE POLICY "mentorship_requests_select"
  ON public.mentorship_requests FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);

CREATE POLICY "mentorship_requests_insert"
  ON public.mentorship_requests FOR INSERT
  WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "mentorship_requests_update"
  ON public.mentorship_requests FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);

CREATE POLICY "mentorship_requests_delete"
  ON public.mentorship_requests FOR DELETE
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);


-- TABLE: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'general' CHECK (type IN (
                 'mentorship_request','mentorship_accepted','mentorship_rejected',
                 'application_update','system','general'
               )),
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  related_id   TEXT,
  related_type TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx    ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);


-- TABLE: search_history
CREATE TABLE IF NOT EXISTS public.search_history (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query         TEXT NOT NULL,
  category      TEXT CHECK (category IN (
                  'college','scholarship','loan','government_scheme',
                  'startup_funding','financial_literacy',
                  'mentor','general'
                )),
  filters       JSONB,
  results_count INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS search_history_user_id_idx    ON public.search_history (user_id);
CREATE INDEX IF NOT EXISTS search_history_category_idx   ON public.search_history (category);
CREATE INDEX IF NOT EXISTS search_history_created_at_idx ON public.search_history (created_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "search_history_select_own" ON public.search_history;
DROP POLICY IF EXISTS "search_history_insert_own" ON public.search_history;
DROP POLICY IF EXISTS "search_history_delete_own" ON public.search_history;

CREATE POLICY "search_history_select_own"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "search_history_insert_own"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "search_history_delete_own"
  ON public.search_history FOR DELETE
  USING (auth.uid() = user_id);
