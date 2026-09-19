// The AARVAK point catalog, exactly as it stands in central's activity_catalog
// table. It is the published rulebook, so it is shipped with the site rather
// than fetched: the public board must render for someone with no account, and
// the catalog table is readable only to signed-in people.
//
// If a rule ever changes in the database, regenerate this file. It is the one
// place in the front end that can drift.

export type CatalogRow = { code: string; label: string; level: string | null; points: number; category: string };

export const CATEGORY_LABEL: Record<string, string> = {
  sprint_track: "SPRINT TRACK",
  team_activity: "TEAM ACTIVITY",
  individual: "INDIVIDUAL",
  bonus: "BONUS",
};

export const CATALOG: CatalogRow[] = [
  { code: "SPRINT_TRACK_FULL_STREAK", label: "Full track streak, one-time bonus", level: "One-time bonus", points: 30, category: "sprint_track" },
  { code: "SPRINT_TRACK_WINNER", label: "Sprint track winner", level: "Winner", points: 25, category: "sprint_track" },
  { code: "SPRINT_TRACK_RUNNER_UP", label: "Sprint track runner-up", level: "Runner-up", points: 15, category: "sprint_track" },
  { code: "SPRINT_TRACK_PARTICIPATION", label: "Sprint track participation", level: "Participation", points: 8, category: "sprint_track" },
  { code: "FINAL_PROJECT_WINNER", label: "Final / Major Project winner", level: "Winner", points: 250, category: "team_activity" },
  { code: "FINAL_PROJECT_RUNNER_UP", label: "Final / Major Project runner-up", level: "Runner-up", points: 100, category: "team_activity" },
  { code: "EXT_HACKATHON_1ST", label: "External Hackathon, 1st place", level: "1st Place", points: 50, category: "team_activity" },
  { code: "FINAL_PROJECT_PARTICIPANT", label: "Final / Major Project, other participating team", level: "Participant", points: 50, category: "team_activity" },
  { code: "EXT_HACKATHON_2ND", label: "External Hackathon, 2nd place", level: "2nd Place", points: 30, category: "team_activity" },
  { code: "SOCIETY_PROJECT_ADVANCED", label: "Society Project, advanced", level: "Advanced", points: 30, category: "team_activity" },
  { code: "WEEKLY_CHALLENGE_WINNER", label: "Weekly Challenge winner", level: "Winner", points: 30, category: "team_activity" },
  { code: "OSS_PR_MERGED_SOCIETY", label: "Open Source, PR merged in society repo", level: "PR Merged Society", points: 25, category: "team_activity" },
  { code: "EXT_HACKATHON_3RD", label: "External Hackathon, 3rd place", level: "3rd Place", points: 20, category: "team_activity" },
  { code: "OSS_PR_MERGED_EXTERNAL", label: "Open Source, PR merged in external public repo", level: "PR Merged External", points: 20, category: "team_activity" },
  { code: "SOCIETY_PROJECT_INTERMEDIATE", label: "Society Project, intermediate", level: "Intermediate", points: 20, category: "team_activity" },
  { code: "WEEKLY_CHALLENGE_RUNNER_UP", label: "Weekly Challenge runner-up", level: "Runner-up", points: 15, category: "team_activity" },
  { code: "EXT_HACKATHON_PARTICIPATION", label: "External Hackathon participation", level: "Participation", points: 10, category: "team_activity" },
  { code: "OSS_PR_RAISED", label: "Open Source, PR raised", level: "PR Raised", points: 10, category: "team_activity" },
  { code: "SOCIETY_PROJECT_BASIC", label: "Society Project, basic", level: "Basic", points: 10, category: "team_activity" },
  { code: "MEETUP_ATTENDANCE", label: "Bi-Weekly Meetup attendance", level: "Attendance", points: 5, category: "team_activity" },
  { code: "WEEKLY_CHALLENGE_PARTICIPATION", label: "Weekly Challenge participation", level: "Participation", points: 5, category: "team_activity" },
  { code: "DSA_STREAK_MONTHLY", label: "DSA streak, monthly", level: "Monthly streak", points: 100, category: "individual" },
  { code: "RESEARCH_PAPER", label: "Research paper publication or submission", level: "Publication / Submission", points: 50, category: "individual" },
  { code: "DSA_STREAK_7DAY", label: "DSA streak, 7 days", level: "7-day streak", points: 20, category: "individual" },
  { code: "TECH_TALK", label: "Tech talk delivered", level: "Delivery", points: 15, category: "individual" },
  { code: "BLOG_ARTICLE", label: "Blog or article published", level: "Publication", points: 10, category: "individual" },
  { code: "EXTERNAL_EVENT_PARTICIPATION", label: "External event attendance or participation", level: "Attendance / Participation", points: 10, category: "individual" },
];
