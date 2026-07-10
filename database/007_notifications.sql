-- ElevateHer AI: Notifications and Preferences Migration
-- Incremental migration — run AFTER all prior migrations.
-- Run this file in the Supabase SQL Editor.
-- Do NOT modify any previous migration files.

-- ── 1. Extend notifications table ──────────────────────────────────────────
DO $$
BEGIN
  -- Add category column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'notifications'
      AND column_name  = 'category'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN category TEXT;
  END IF;

  -- Add source column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'notifications'
      AND column_name  = 'source'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN source TEXT;
  END IF;
END $$;

-- Drop old check constraint if it exists and add the new one including new notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'mentorship_request',
  'mentorship_accepted',
  'mentorship_rejected',
  'mentorship_connection',
  'mentor_match',
  'message_received',
  'unread_message',
  'welcome',
  'feature_announcement',
  'recommendation_update',
  'application_update',
  'system',
  'general'
));

-- ── 2. Create notification_preferences table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_updates BOOLEAN NOT NULL DEFAULT TRUE,
  loan_updates BOOLEAN NOT NULL DEFAULT TRUE,
  government_scheme_updates BOOLEAN NOT NULL DEFAULT TRUE,
  financial_literacy_updates BOOLEAN NOT NULL DEFAULT TRUE,
  mentorship_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  message_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "preferences_select_own" ON public.notification_preferences;
CREATE POLICY "preferences_select_own"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "preferences_insert_own" ON public.notification_preferences;
CREATE POLICY "preferences_insert_own"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "preferences_update_own" ON public.notification_preferences;
CREATE POLICY "preferences_update_own"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at on preferences
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 3. Create notification_tracker table for duplicate prevention ─────────────
CREATE TABLE IF NOT EXISTS public.notification_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  update_hash TEXT NOT NULL,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id, update_hash)
);

-- Enable RLS on tracker
ALTER TABLE public.notification_tracker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracker_select_own" ON public.notification_tracker;
CREATE POLICY "tracker_select_own"
  ON public.notification_tracker FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tracker_insert_own" ON public.notification_tracker;
CREATE POLICY "tracker_insert_own"
  ON public.notification_tracker FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Extend saved_items table with monitoring metadata columns ──────────────
DO $$
BEGIN
  -- Add source_url column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'saved_items'
      AND column_name  = 'source_url'
  ) THEN
    ALTER TABLE public.saved_items ADD COLUMN source_url TEXT;
  END IF;

  -- Add official_website column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'saved_items'
      AND column_name  = 'official_website'
  ) THEN
    ALTER TABLE public.saved_items ADD COLUMN official_website TEXT;
  END IF;

  -- Add last_checked_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'saved_items'
      AND column_name  = 'last_checked_at'
  ) THEN
    ALTER TABLE public.saved_items ADD COLUMN last_checked_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS saved_items_last_checked_idx ON public.saved_items (last_checked_at);
