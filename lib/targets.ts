export interface SmartTarget {
  id: string;
  label: string;
  baseline: number;
  target: number;
  deadline: string;
  unit: string;
  lowerIsBetter?: boolean;
}

export const SMART_TARGETS: SmartTarget[] = [
  { id: "npm_monthly", label: "npm Downloads/month", baseline: 725, target: 3600, deadline: "Q4 2026", unit: "/month" },
  { id: "crates_monthly", label: "Crates.io Downloads/month", baseline: 450, target: 2250, deadline: "Q4 2026", unit: "/month" },
  { id: "github_stars", label: "GitHub Stars (total)", baseline: 570, target: 1000, deadline: "Q4 2026", unit: "stars" },
  { id: "dependents", label: "Dependent Repos", baseline: 446, target: 600, deadline: "Q4 2026", unit: "repos" },
  { id: "active_builders", label: "Active Builders", baseline: 6, target: 30, deadline: "Q4 2026", unit: "builders" },
  { id: "ttfhw", label: "Time to First Hello World", baseline: 45, target: 10, deadline: "Q4 2026", unit: "min", lowerIsBetter: true },
];
