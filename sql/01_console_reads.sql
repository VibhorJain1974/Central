-- ===========================================================================
-- AARVAK CENTRAL : what the console needs that central did not have yet
--
-- Already applied to the central project on 18 Sep 2026. Kept here as the
-- record, and so a rebuilt database gets it too. Safe to run again.
--
-- Note on schemas: the permission helpers (is_staff, has_org_scope,
-- lead_team_id) live in the `app` schema, not `public`. The tables and enums
-- live in `public`. Qualify accordingly or Postgres will say the function
-- does not exist.
-- ===========================================================================

-- 1. A supervised way to read the bonus and penalty history.
--
-- point_adjustments is deliberately closed: no grant to `authenticated` and
-- no RLS policy, because it is the record of every bonus and penalty and it
-- should not be browsable by anyone holding a login. This function is the one
-- way in, and it checks on every call that the caller is an organiser or is
-- asking about their own team.

create or replace function public.list_adjustments(p_limit int default 100)
returns table (
  id          uuid,
  team_id     uuid,
  team_name   text,
  team_slug   text,
  member_id   uuid,
  member_name text,
  points      int,
  reason      text,
  kind        text,
  occurred_on date,
  created_at  timestamptz,
  reverses    uuid,
  reversed_by uuid
)
language sql
stable
security definer
set search_path = public, app
as $fn$
  select a.id,
         a.team_id,
         t.name,
         t.slug,
         a.member_id,
         m.display_name,
         a.points,
         a.reason,
         a.kind,
         a.occurred_on,
         a.created_at,
         a.reverses,
         r.id
    from public.point_adjustments a
    join public.teams t                  on t.id = a.team_id
    left join public.members m           on m.id = a.member_id
    left join public.point_adjustments r on r.reverses = a.id
   where app.is_staff()
      or app.has_org_scope('view_all'::public.grant_scope_t)
      or a.team_id = app.lead_team_id()
   order by a.created_at desc
   limit greatest(1, least(coalesce(p_limit, 100), 500));
$fn$;

revoke all on function public.list_adjustments(int) from public;
grant execute on function public.list_adjustments(int) to authenticated;


-- 2. Two grants that went missing.
--
-- There is an event trigger, strip_public_execute, that revokes execute from
-- PUBLIC whenever a function is created. Useful, but it means that any time a
-- function is dropped and recreated, its role grants have to be put back by
-- hand. get_scoreboard lost its grant when it was rebuilt to include
-- adjustments, which would have left the console overview empty.

grant execute on function public.get_scoreboard()      to authenticated;
grant execute on function public.published_standings() to authenticated;


-- Check. As an organiser the first returns rows, as anyone else it returns
-- none, and the second should list every function the site calls as runnable.
--
-- select * from public.list_adjustments(20);
--
-- select p.proname,
--        has_function_privilege('authenticated', p.oid, 'execute') as authed,
--        has_function_privilege('anon', p.oid, 'execute') as anon
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in ('get_leaderboard','get_scoreboard','get_review_queue',
--                     'decide_submission','publish_leaderboard','preview_publish',
--                     'redeem_enrolment_code','get_ingest_health','my_access',
--                     'adjust_points','reverse_adjustment','list_adjustments')
-- order by 1;
