// Every read the public side of the site makes. All of these are anon-callable
// on central and all of them are cut off at the last publication, so nothing
// here can leak a standing an organiser has not signed off.

import { supabaseServer } from "@/lib/supabase-server";

export type Stats = {
  teams: number; members: number; approved: number;
  publications: number; published_at: string | null; points_on_board: number;
};

export type BoardRow = {
  team_name: string; slug: string; total_points: number;
  rank: number; movement: number; published_at: string;
};

export type TeamSummary = {
  id: string; name: string; slug: string;
  rank: number | null; total_points: number; movement: number;
  published_at: string | null; approved_count: number; member_count: number;
  by_category: { category: string; points: number; count: number }[];
  top_activity: string | null;
};

export type SubmissionRow = {
  id: string; title: string; activity_label: string; activity_code: string;
  category: string; points: number; occurred_on: string;
  member_name: string | null; contributors: string[];
};

export type RosterRow = {
  member_name: string; department: string | null;
  approved_points: number; approved_count: number;
};

export type FeedRow = {
  team_name: string; team_slug: string; title: string; activity_label: string;
  points: number; occurred_on: string; decided_at: string; member_name: string | null;
};

export type PersonRow = {
  member_name: string; team_name: string; team_slug: string;
  points: number; entries: number; best_activity: string | null;
};

export type CatalogRow = {
  code: string; label: string; level: string | null; points: number; category: string;
};

export type TimelineRow = {
  published_at: string; note: string | null;
  team_name: string; team_slug: string; total_points: number; rank: number;
};

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc(fn, args ?? {});
  if (error) {
    // A public page must never blow up because one panel could not load.
    console.error(`[public] ${fn}:`, error.message);
    return null;
  }
  return data as T;
}

export const getStats     = () => rpc<Stats>("public_stats");
export const getBoard     = () => rpc<BoardRow[]>("get_leaderboard");
export const getFeed      = (n = 40) => rpc<FeedRow[]>("public_feed", { p_limit: n });
export const getPeople    = (n = 50) => rpc<PersonRow[]>("public_member_board", { p_limit: n });
export const getCatalog   = () => rpc<CatalogRow[]>("public_catalog");
export const getTimeline  = () => rpc<TimelineRow[]>("public_timeline");
export const getTeam      = (slug: string) => rpc<TeamSummary>("public_team", { p_slug: slug });
export const getRoster    = (slug: string) => rpc<RosterRow[]>("public_roster", { p_slug: slug });
export const getTeamSubs  = (slug: string, n = 200) =>
  rpc<SubmissionRow[]>("public_team_submissions", { p_slug: slug, p_limit: n });
