-- ElevateHer AI: College/School Fields + In-App Messaging
-- Incremental migration — run AFTER 005_mentorship.sql
-- Run this file in the Supabase SQL Editor.
-- Do NOT modify previous migration files.
--
-- Changes:
--   1. Add college_name column to profiles (the college/university attended)
--   2. Add school_name column to profiles (the school attended up to Class 12)
--   3. Add indexes on both columns for fast mentorship matching
--   4. Create messages table for in-app mentor/mentee chat
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Add college_name to profiles (idempotent) ──────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'college_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN college_name TEXT;
    COMMENT ON COLUMN public.profiles.college_name IS
      'Name of the college or university the user attended / is attending.';
  END IF;
END $$;


-- ── 2. Add school_name to profiles (idempotent) ───────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'school_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN school_name TEXT;
    COMMENT ON COLUMN public.profiles.school_name IS
      'Name of the school the user attended up to Class 10 / Class 12.';
  END IF;
END $$;


-- ── 3. Indexes for fast mentorship college/school matching ────────────────

CREATE INDEX IF NOT EXISTS profiles_college_name_idx
  ON public.profiles (college_name)
  WHERE college_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_school_name_idx
  ON public.profiles (school_name)
  WHERE school_name IS NOT NULL;


-- ── 4. TABLE: messages ────────────────────────────────────────────────────
-- Simple in-app messaging between mentor/mentee pairs.
-- Only users who share an active mentorship_connection may message each other.
-- Designed to be minimal and extendable (reactions, attachments in future phases).

CREATE TABLE IF NOT EXISTS public.messages (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id  UUID NOT NULL REFERENCES public.mentorship_connections(id) ON DELETE CASCADE,
  sender_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content        TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup: all messages in a connection ordered by time
CREATE INDEX IF NOT EXISTS messages_connection_id_idx
  ON public.messages (connection_id, created_at ASC);

-- Fast lookup: unread messages for a receiver
CREATE INDEX IF NOT EXISTS messages_receiver_unread_idx
  ON public.messages (receiver_id, is_read)
  WHERE is_read = FALSE;

-- Fast lookup: sender's sent messages
CREATE INDEX IF NOT EXISTS messages_sender_id_idx
  ON public.messages (sender_id, created_at DESC);


ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SELECT: only the sender or receiver can read their messages
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- INSERT: only authenticated users who are part of the connection may send
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.mentorship_connections mc
      WHERE mc.id = connection_id
        AND mc.status = 'active'
        AND (mc.mentor_id = auth.uid() OR mc.learner_id = auth.uid())
    )
  );

-- UPDATE: only the receiver can mark a message as read
DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- DELETE: sender can delete their own messages
DROP POLICY IF EXISTS "messages_delete" ON public.messages;
CREATE POLICY "messages_delete"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);


-- ── 5. Realtime: enable messages table for live updates ──────────────────
-- Run this separately if needed: ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- (Supabase enables realtime per-table in the dashboard; this comment documents the intent.)
