export interface RepoMetrics {
  stars: number;
  forks: number;
  open_issues: number;
  dependents?: number;
}

export interface NpmPackageMetrics {
  weekly: number;
}

export interface CrateMetrics {
  recent: number;
  total: number;
}

export interface CrateDependents {
  rust: number;
  npm: number;
}

export interface ManualMetrics {
  ttfhw_minutes: number | null;
  active_builders: number | null;
  community_projects: number | null;
  homeserver_nodes: number | null;
  docs_monthly_visitors: number | null;
  bounty_completion_rate: number | null;
  events_attended: number | null;
}

export interface MetricSnapshot {
  date: string;
  github: {
    org_followers: number;
    repos: Record<string, RepoMetrics>;
  };
  npm: Record<string, NpmPackageMetrics>;
  crates: Record<string, CrateMetrics>;
  dependents?: Record<string, CrateDependents>;
  manual: ManualMetrics;
}

export type TrendDirection = "up" | "down" | "flat";

export interface DateRangeFilter {
  from?: string;
  to?: string;
}
