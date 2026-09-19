// Everything the front end knows about the five teams that is not in the
// database: their artwork, where to crop it, and the one line that says who
// they are. Slugs match central's teams table exactly.

export type TeamMeta = {
  slug: string;
  name: string;
  accent: string;
  /** Full poster. Cropped by CSS, so every use needs a focal point. */
  art: string;
  /** object-position for the art, tuned per poster. */
  focal: string;
  /** Hero image, when the poster itself carries the team name and would say it
   *  twice on their page. Falls back to the poster. */
  hero?: string;
  heroFocal?: string;
  /** Square emblem, where the team actually has one. */
  mark?: string;
  /** Wide lockup, for the teams whose brand is a wordmark rather than a mark. */
  word?: string;
  tagline: string;
  blurb: string;
};

export const TEAMS: TeamMeta[] = [
  {
    slug: "nexus",
    name: "NEXUS",
    accent: "#4C8DFF",
    art: "/teams/nexus-art.webp",
    focal: "50% 38%",
    mark: "/teams/nexus-mark.webp",
    tagline: "The join between things",
    blurb:
      "Builds in the open and ships before it is comfortable, then makes it right in public. The team most likely to have a working prototype while everyone else is still arguing about the stack.",
  },
  {
    slug: "echo",
    name: "ECHO",
    accent: "#D8DEE6",
    art: "/teams/echo-art.webp",
    focal: "50% 50%",
    hero: "/teams/echo-hero.webp",
    heroFocal: "60% 45%",
    word: "/teams/echo-word.webp",
    tagline: "Leave a mark, leave an echo",
    blurb:
      "Carries work further than the people who made it could alone. Documentation, talks, write-ups, the unglamorous things that decide whether a project outlives the sprint.",
  },
  {
    slug: "ascend",
    name: "ASCEND",
    accent: "#D4342B",
    art: "/teams/ascend-art.webp",
    focal: "50% 45%",
    hero: "/teams/ascend-hero.webp",
    heroFocal: "50% 40%",
    word: "/teams/ascend-word.webp",
    tagline: "The horizon stays the same even when you turn around",
    blurb:
      "Climbs, measures the climb, then starts again from the higher mark. Relentless about beating its own last number rather than anyone else's.",
  },
  {
    slug: "byte-brigade",
    name: "BYTE BRIGADE",
    accent: "#57D94A",
    art: "/teams/byte-brigade-art.webp",
    focal: "50% 60%",
    mark: "/teams/byte-brigade-mark.webp",
    tagline: "Small commits, relentless cadence",
    blurb:
      "Wins on frequency. Nothing dramatic on any given day, and then you look at the month and they have shipped more than anyone. Nothing gets left half finished.",
  },
  {
    slug: "cipher",
    name: "CIPHER",
    accent: "#E8A33C",
    art: "/teams/cipher-art.webp",
    focal: "50% 42%",
    mark: "/teams/cipher-mark.webp",
    tagline: "Take it apart to find out how it was meant to work",
    blurb:
      "Security, reverse engineering, the puzzle for its own sake. The team that reads the spec and then reads what the spec forgot to say.",
  },
];

export const TEAM_BY_SLUG: Record<string, TeamMeta> = Object.fromEntries(
  TEAMS.map((t) => [t.slug, t])
);

export const accentOf = (slug: string) => TEAM_BY_SLUG[slug]?.accent ?? "#A49AEA";
export const metaOf = (slug: string) => TEAM_BY_SLUG[slug];

export const CATEGORY_LABEL: Record<string, string> = {
  sprint_track: "SPRINT TRACK",
  team_activity: "TEAM ACTIVITY",
  individual: "INDIVIDUAL",
  bonus: "BONUS",
};
