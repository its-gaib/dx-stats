export interface Milestone {
  date: string;
  label: string;
}

export const MILESTONES: Milestone[] = [
  // iroh PR #4026 (merged 2026-04-16, released 2026-04-17 in iroh 0.98.0):
  // dropped the `pkarr` dependency from `iroh` and `iroh-relay`.
  // https://github.com/n0-computer/iroh/pull/4026
  { date: "2026-04-16", label: "iroh drops pkarr" },
];
