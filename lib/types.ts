export type StaffRole = "em_head" | "secretary" | "president" | "vice_president" | null;

export type Access = {
  user_id: string | null;
  display_name: string | null;
  staff_role: StaffRole;
  lead_of: string | null;
  lead_team_name: string | null;
  lead_team_slug: string | null;
  can_view_all: boolean;
  can_approve: boolean;
  can_publish: boolean;
  can_grant: boolean;
  active_grants: { scope: string; expires_at: string }[];
};

export type Proof = { url: string; filename: string | null };

export type QueueRow = {
  id: string;
  team_name: string;
  team_slug: string;
  member_name: string | null;
  contributors: string[] | null;
  activity_code: string;
  activity_label: string;
  activity_points: number;
  category: string;
  title: string;
  description: string | null;
  occurred_on: string;
  venue: string | null;
  team_status: "pending" | "verified" | "rejected";
  central_status: "pending" | "approved" | "rejected" | "needs_info" | "revoked";
  proofs: Proof[] | null;
  first_seen_at: string;
};

export type BoardRow = {
  team_name: string;
  slug: string;
  total_points: number;
  rank: number;
  movement: number;
  published_at: string;
};

export type ScoreRow = {
  team_id: string;
  name: string;
  slug: string;
  total_points: number;
  approved_points: number;
  adjustment_points: number;
  pending_central: number;
};

// One source of truth for team colour lives in lib/teams.ts, next to the rest
// of each team's identity. Re-exported here so the console keeps its imports.
export { accentOf, TEAM_BY_SLUG } from "@/lib/teams";
