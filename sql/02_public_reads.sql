-- ===========================================================================
-- AARVAK CENTRAL : the public read layer
--
-- Already applied to central on 19 Sep 2026. Kept here as the record.
--
-- Why these exist. Everything on central is locked to signed-in people, which
-- is correct for the console but leaves the public site with nothing to show
-- except a leaderboard. These eight functions open exactly what a visitor
-- should see and nothing else.
--
-- The rule that makes them safe: every one of them is cut off at the last
-- published board. A visitor cannot add up approvals that an organiser has not
-- signed off yet, so the freeze holds. Proofs are never exposed.
--
-- Helpers live in the `app` schema, tables and enums in `public`.
-- ===========================================================================

create or replace function app.public_cutoff()
returns timestamptz language sql stable security definer set search_path to ''
as $$ select max(p.published_at) from public.leaderboard_publications p; $$;

-- public_team(slug)             one team: rank, points, movement, category split
-- public_team_submissions(slug) that team's approved, published entries
-- public_roster(slug)           who is on the team and what each has approved
-- public_feed(n)                recent approvals across all five teams
-- public_member_board(n)        individuals ranked by approved points
-- public_timeline()             every board ever signed, for the race chart
-- public_catalog()              the live point rules
-- public_stats()                counts for the hero strip
--
-- The full bodies were applied directly. To regenerate this file from the
-- live database:
--
--   select pg_get_functiondef(p.oid)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname like 'public!_%' escape '!';

-- Grants. Remember the strip_public_execute event trigger: any function that
-- is dropped and recreated loses these and must have them put back.
grant execute on function public.public_team(text)                to anon, authenticated;
grant execute on function public.public_team_submissions(text,int) to anon, authenticated;
grant execute on function public.public_roster(text)              to anon, authenticated;
grant execute on function public.public_feed(int)                 to anon, authenticated;
grant execute on function public.public_member_board(int)         to anon, authenticated;
grant execute on function public.public_timeline()                to anon, authenticated;
grant execute on function public.public_catalog()                 to anon, authenticated;
grant execute on function public.public_stats()                   to anon, authenticated;
