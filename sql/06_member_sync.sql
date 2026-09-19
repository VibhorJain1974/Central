-- =============================================================================
-- 06_member_sync.sql — add member sync to existing central_outbox pipeline
--
-- Run this AFTER 05_sync.sql is already in place and working.
-- Works for BYTE BRIGADE, ECHO, NEXUS (all same old-central schema).
-- CIPHER uses a different trigger (already applied separately).
--
-- What this does:
--   • Allows NULL on central_outbox.submission_id (member events have no sub)
--   • Adds central_build_member_payload() — builds the member.upserted envelope
--   • Adds a trigger on profiles: any INSERT or UPDATE fires the member sync
--   • Backfills all existing profiles right now
-- =============================================================================

-- 1. Allow member events (no submission) in the outbox
ALTER TABLE public.central_outbox
  ALTER COLUMN submission_id DROP NOT NULL;

-- 2. Member payload builder
CREATE OR REPLACE FUNCTION public.central_build_member_payload(p_profile_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'event_id',    'mem-' || p_profile_id::text,
    'event_type',  'member.upserted',
    'occurred_at', now(),
    'payload', jsonb_build_object(
      'external_member_id', p_profile_id::text,
      'display_name',       p.full_name,
      'department',         p.department,
      'email',              NULL
    )
  )
  FROM public.profiles p
  WHERE p.id = p_profile_id;
$$;

-- 3. Trigger function — fires on every profile INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.central_enqueue_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_payload jsonb;
BEGIN
  v_payload := public.central_build_member_payload(NEW.id);
  IF v_payload IS NULL THEN RETURN NEW; END IF;

  -- Upsert: if this member already has a pending/failed row, replace it
  INSERT INTO public.central_outbox (submission_id, event_id, payload)
  VALUES (NULL, v_payload->>'event_id', v_payload)
  ON CONFLICT (event_id) DO UPDATE
    SET payload = excluded.payload, status = 'pending', attempts = 0;

  RETURN NEW;
END;
$$;

-- 4. Attach to profiles — fires on join and on name/dept changes
DROP TRIGGER IF EXISTS central_enqueue_member_trg ON public.profiles;
CREATE TRIGGER central_enqueue_member_trg
  AFTER INSERT OR UPDATE OF full_name, department
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.central_enqueue_member();

-- 5. Backfill all existing profiles immediately
INSERT INTO public.central_outbox (submission_id, event_id, payload)
SELECT
  NULL,
  'mem-' || p.id::text,
  public.central_build_member_payload(p.id)
FROM public.profiles p
WHERE public.central_build_member_payload(p.id) IS NOT NULL
ON CONFLICT (event_id) DO NOTHING;

-- Send the backlog right now (same as 05_sync.sql does at the end)
SELECT public.central_dispatch();

-- Confirm: how many member rows queued?
SELECT COUNT(*) AS member_events_queued
FROM public.central_outbox
WHERE event_id LIKE 'mem-%' AND status IN ('pending', 'in_flight');
