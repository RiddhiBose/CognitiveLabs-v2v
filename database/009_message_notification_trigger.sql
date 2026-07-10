-- ElevateHer AI: Message Notification Trigger
-- Incremental migration — run AFTER 008_saved_items.sql
-- Run this file in the Supabase SQL Editor.
--
-- Problem this fixes:
--   When user A sends a message to user B, the client-side code attempts to
--   INSERT a notification row with user_id = B while authenticated as A.
--   The RLS policy "notifications_insert_own" (auth.uid() = user_id) blocks
--   this insert silently — B never receives a notification.
--
-- Solution:
--   A SECURITY DEFINER trigger function on the messages table. It runs as the
--   function owner (postgres / service role), bypasses RLS, and inserts the
--   notification row directly for the receiver.
--   The application client no longer needs to insert cross-user notifications.
--
-- Also adds:
--   - A policy allowing the notifications INSERT from any authenticated session
--     where the insert is made on behalf of the receiver (belt-and-suspenders
--     fallback for any future server-side edge function usage).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Drop and recreate the trigger function ─────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER           -- runs as function owner, bypasses RLS
SET search_path = public   -- prevent search_path hijacking
AS $$
DECLARE
  v_sender_name TEXT;
  v_truncated   TEXT;
BEGIN
  -- Fetch the sender's display name from profiles
  SELECT full_name
    INTO v_sender_name
    FROM public.profiles
   WHERE user_id = NEW.sender_id
   LIMIT 1;

  IF v_sender_name IS NULL THEN
    v_sender_name := 'Someone';
  END IF;

  -- Truncate content for the notification preview
  IF char_length(NEW.content) > 60 THEN
    v_truncated := left(NEW.content, 57) || '...';
  ELSE
    v_truncated := NEW.content;
  END IF;

  -- Check receiver's message_notifications preference
  -- Default to TRUE if no preference row exists yet
  IF EXISTS (
    SELECT 1
      FROM public.notification_preferences
     WHERE user_id = NEW.receiver_id
       AND message_notifications = FALSE
  ) THEN
    RETURN NEW;   -- user has opted out — do nothing
  END IF;

  -- Insert the notification for the receiver
  -- SECURITY DEFINER bypasses the RLS insert policy
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    related_id,
    related_type,
    category,
    source,
    created_at
  ) VALUES (
    NEW.receiver_id,
    'New Message from ' || v_sender_name,
    v_sender_name || ': "' || v_truncated || '"',
    'message_received',
    FALSE,
    NEW.connection_id::TEXT,
    'chat',
    'messaging',
    v_sender_name,
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Grant EXECUTE to authenticated users so the trigger can be invoked
-- (the function itself is SECURITY DEFINER so the caller's privileges don't matter)
REVOKE ALL ON FUNCTION public.notify_on_new_message() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_on_new_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_on_new_message() TO service_role;


-- ── 2. Attach the trigger to the messages table ───────────────────────────

DROP TRIGGER IF EXISTS trg_notify_on_new_message ON public.messages;

CREATE TRIGGER trg_notify_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();


-- ── 3. Add a service-role bypass INSERT policy on notifications ───────────
-- Allows edge functions / service role to insert notifications for any user.
-- Belt-and-suspenders alongside the trigger approach.

DROP POLICY IF EXISTS "notifications_insert_service_role" ON public.notifications;
CREATE POLICY "notifications_insert_service_role"
  ON public.notifications FOR INSERT
  WITH CHECK (
    -- own notifications (existing path)
    auth.uid() = user_id
    OR
    -- service_role bypass (edge functions, triggers running via service key)
    auth.role() = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- MENTORSHIP REQUEST NOTIFICATION TRIGGERS
-- Same RLS problem as messages: the learner is authenticated when sending a
-- request, but the notification must be inserted for the mentor (different
-- user_id). SECURITY DEFINER bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 4. Notify mentor when a new mentorship request is sent ───────────────
-- Fires on INSERT into mentorship_requests.
-- Inserts a notification for the MENTOR.

CREATE OR REPLACE FUNCTION public.notify_mentor_on_new_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_learner_name TEXT;
  v_msg_preview  TEXT;
BEGIN
  -- Get learner's display name
  SELECT full_name
    INTO v_learner_name
    FROM public.profiles
   WHERE user_id = NEW.learner_id
   LIMIT 1;

  IF v_learner_name IS NULL THEN
    v_learner_name := 'A learner';
  END IF;

  -- Build message preview
  IF NEW.message IS NOT NULL AND char_length(NEW.message) > 0 THEN
    IF char_length(NEW.message) > 80 THEN
      v_msg_preview := '"' || left(NEW.message, 77) || '..."';
    ELSE
      v_msg_preview := '"' || NEW.message || '"';
    END IF;
  ELSE
    v_msg_preview := 'No message included.';
  END IF;

  -- Check mentor's mentorship_notifications preference
  IF EXISTS (
    SELECT 1
      FROM public.notification_preferences
     WHERE user_id = NEW.mentor_id
       AND mentorship_notifications = FALSE
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    related_id,
    related_type,
    category,
    source,
    created_at
  ) VALUES (
    NEW.mentor_id,
    'New Mentorship Request from ' || v_learner_name,
    v_learner_name || ' has sent you a mentorship request. ' || v_msg_preview,
    'mentorship_request',
    FALSE,
    NEW.id::TEXT,
    'mentorship_request',
    'mentorship',
    v_learner_name,
    NOW()
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_mentor_on_new_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_mentor_on_new_request() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_mentor_on_new_request() TO service_role;

DROP TRIGGER IF EXISTS trg_notify_mentor_on_new_request ON public.mentorship_requests;

CREATE TRIGGER trg_notify_mentor_on_new_request
  AFTER INSERT ON public.mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mentor_on_new_request();


-- ── 5. Notify learner when mentor accepts or rejects their request ────────
-- Fires on UPDATE to mentorship_requests when status changes.
-- Inserts a notification for the LEARNER.

CREATE OR REPLACE FUNCTION public.notify_learner_on_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mentor_name TEXT;
  v_title       TEXT;
  v_message     TEXT;
  v_type        TEXT;
BEGIN
  -- Only fire when status actually changes to accepted or rejected
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('accepted', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Get mentor's display name
  SELECT full_name
    INTO v_mentor_name
    FROM public.profiles
   WHERE user_id = NEW.mentor_id
   LIMIT 1;

  IF v_mentor_name IS NULL THEN
    v_mentor_name := 'Your mentor';
  END IF;

  -- Check learner's mentorship_notifications preference
  IF EXISTS (
    SELECT 1
      FROM public.notification_preferences
     WHERE user_id = NEW.learner_id
       AND mentorship_notifications = FALSE
  ) THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'accepted' THEN
    v_title   := 'Mentorship Request Accepted 🎉';
    v_message := v_mentor_name || ' has accepted your mentorship request. You are now connected!';
    v_type    := 'mentorship_accepted';
  ELSE
    v_title   := 'Mentorship Request Update';
    v_message := v_mentor_name || ' was unable to accept your mentorship request at this time.';
    v_type    := 'mentorship_rejected';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    related_id,
    related_type,
    category,
    source,
    created_at
  ) VALUES (
    NEW.learner_id,
    v_title,
    v_message,
    v_type,
    FALSE,
    NEW.id::TEXT,
    'mentorship_request',
    'mentorship',
    v_mentor_name,
    NOW()
  );

  -- On acceptance also insert a connection-established notification
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      is_read,
      related_id,
      related_type,
      category,
      source,
      created_at
    ) VALUES (
      NEW.learner_id,
      'Mentorship Connection Established',
      'You are now connected with ' || v_mentor_name || '. Reach out to begin your mentorship journey!',
      'mentorship_connection',
      FALSE,
      NEW.id::TEXT,
      'mentorship_connection',
      'mentorship',
      v_mentor_name,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_learner_on_request_update() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_learner_on_request_update() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_learner_on_request_update() TO service_role;

DROP TRIGGER IF EXISTS trg_notify_learner_on_request_update ON public.mentorship_requests;

CREATE TRIGGER trg_notify_learner_on_request_update
  AFTER UPDATE ON public.mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_learner_on_request_update();
