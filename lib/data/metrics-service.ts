import type { DateRangeFilter, MetricSnapshot, TrendDirection } from "@/lib/data/types";
import { SMART_TARGETS, type SmartTarget } from "@/lib/targets";

/* -----------------------------------------------------------------------
   Flattened record for Recharts (needs flat key-value pairs)
   ----------------------------------------------------------------------- */

export interface FlatMetricRecord {
  date: string;
  // GitHub aggregate
  github_total_stars: number;
  github_total_forks: number;
  github_total_dependents: number;
  github_total_open_issues: number;
  github_org_followers: number;
  // npm aggregate
  npm_total_weekly: number;
  // crates aggregate
  crates_total_recent: number;
  // per-repo stars (dynamic keys like "stars_pkarr", "stars_pkdns")
  [key: string]: number | string;
}

export interface DashboardKpi {
  id: string;
  label: string;
  value: number;
  previous: number;
  delta: number;
  deltaPct: number;
  trend: TrendDirection;
  format: "number" | "percent" | "minutes";
  target?: SmartTarget;
}

export interface DashboardData {
  snapshots: MetricSnapshot[];
  flatPoints: FlatMetricRecord[];
  latest: MetricSnapshot | null;
  previous: MetricSnapshot | null;
  kpis: DashboardKpi[];
  repoNames: string[];
  npmPackages: string[];
  crateNames: string[];
  dependentCrates: string[];
  startDate: string | null;
  endDate: string | null;
}

/* -----------------------------------------------------------------------
   Main entry point
   ----------------------------------------------------------------------- */

export function computeDashboardData(
  allSnapshots: MetricSnapshot[],
  range?: DateRangeFilter,
): DashboardData {
  const snapshots = filterByDateRange(allSnapshots, range);
  const latest = snapshots.at(-1) ?? null;
  const previous = snapshots.at(-2) ?? null;

  const repoNames = discoverKeys(snapshots, (s) => s.github?.repos);
  const npmPackages = discoverKeys(snapshots, (s) => s.npm);
  const crateNames = discoverKeys(snapshots, (s) => s.crates);
  const dependentCrates = discoverKeys(snapshots, (s) => s.dependents);

  const flatPoints = snapshots.map((s) => flatten(s, repoNames, npmPackages, crateNames, dependentCrates));

  return {
    snapshots,
    flatPoints,
    latest,
    previous,
    kpis: latest && previous ? buildKpis(latest, previous) : [],
    repoNames,
    npmPackages,
    crateNames,
    dependentCrates,
    startDate: snapshots[0]?.date ?? null,
    endDate: snapshots.at(-1)?.date ?? null,
  };
}

function filterByDateRange(records: MetricSnapshot[], range?: DateRangeFilter): MetricSnapshot[] {
  if (!range?.from && !range?.to) return records;
  return records.filter((record) => {
    if (range.from && record.date < range.from) return false;
    if (range.to && record.date > range.to) return false;
    return true;
  });
}

/* -----------------------------------------------------------------------
   Helpers
   ----------------------------------------------------------------------- */

function discoverKeys(snapshots: MetricSnapshot[], accessor: (s: MetricSnapshot) => Record<string, unknown> | undefined): string[] {
  const set = new Set<string>();
  for (const s of snapshots) {
    const obj = accessor(s);
    if (obj) {
      for (const key of Object.keys(obj)) {
        set.add(key);
      }
    }
  }
  return [...set].sort();
}

function flatten(
  s: MetricSnapshot,
  repoNames: string[],
  npmPackages: string[],
  crateNames: string[],
  dependentCrates: string[],
): FlatMetricRecord {
  const rec: FlatMetricRecord = {
    date: s.date,
    github_total_stars: 0,
    github_total_forks: 0,
    github_total_dependents: 0,
    github_total_open_issues: 0,
    github_org_followers: s.github?.org_followers ?? 0,
    npm_total_weekly: 0,
    crates_total_recent: 0,
  };

  for (const repo of repoNames) {
    const r = s.github?.repos?.[repo];
    rec[`stars_${repo}`] = r?.stars ?? 0;
    rec[`forks_${repo}`] = r?.forks ?? 0;
    rec[`issues_${repo}`] = r?.open_issues ?? 0;
    rec.github_total_stars += r?.stars ?? 0;
    rec.github_total_forks += r?.forks ?? 0;
    rec.github_total_open_issues += r?.open_issues ?? 0;
  }

  // Dependents: prefer new per-crate analysis, fall back to old per-repo field
  if (s.dependents) {
    for (const crate of dependentCrates) {
      const d = s.dependents[crate];
      rec[`deps_rust_${crate}`] = d?.rust ?? 0;
      rec[`deps_npm_${crate}`] = d?.npm ?? 0;
      rec.github_total_dependents += (d?.rust ?? 0) + (d?.npm ?? 0);
    }
  } else {
    for (const repo of repoNames) {
      rec.github_total_dependents += s.github?.repos?.[repo]?.dependents ?? 0;
    }
  }

  for (const pkg of npmPackages) {
    const n = s.npm?.[pkg];
    const safeKey = pkg.replace(/[@/]/g, "_");
    rec[`npm_${safeKey}`] = n?.weekly ?? 0;
    rec.npm_total_weekly += n?.weekly ?? 0;
  }

  for (const crate of crateNames) {
    const c = s.crates?.[crate];
    rec[`crate_recent_${crate}`] = c?.recent ?? 0;
    rec[`crate_total_${crate}`] = c?.total ?? 0;
    rec.crates_total_recent += c?.recent ?? 0;
  }

  return rec;
}

function buildKpis(latest: MetricSnapshot, previous: MetricSnapshot): DashboardKpi[] {
  const latestTotalStars = sumRepoField(latest, "stars");
  const prevTotalStars = sumRepoField(previous, "stars");
  const latestTotalDeps = sumDependents(latest);
  const prevTotalDeps = sumDependents(previous);
  const latestNpmTotal = sumNpm(latest);
  const prevNpmTotal = sumNpm(previous);
  const latestCratesTotal = sumCratesRecent(latest);
  const prevCratesTotal = sumCratesRecent(previous);

  const kpis: DashboardKpi[] = [
    createKpi("github_stars", "GitHub Stars", latestTotalStars, prevTotalStars, "number",
      SMART_TARGETS.find((t) => t.id === "github_stars")),
    createKpi("npm_weekly", "npm Downloads/week", latestNpmTotal, prevNpmTotal, "number",
      SMART_TARGETS.find((t) => t.id === "npm_monthly")),
    createKpi("crates_recent", "Crates.io Downloads", latestCratesTotal, prevCratesTotal, "number",
      SMART_TARGETS.find((t) => t.id === "crates_monthly")),
    createKpi("dependents", "Dependent Repos", latestTotalDeps, prevTotalDeps, "number",
      SMART_TARGETS.find((t) => t.id === "dependents")),
  ];

  if (latest.manual?.active_builders != null) {
    kpis.push(
      createKpi("active_builders", "Active Builders",
        latest.manual.active_builders,
        previous.manual?.active_builders ?? 0,
        "number",
        SMART_TARGETS.find((t) => t.id === "active_builders")),
    );
  }

  if (latest.manual?.ttfhw_minutes != null) {
    kpis.push(
      createKpi("ttfhw", "TTFHW",
        latest.manual.ttfhw_minutes,
        previous.manual?.ttfhw_minutes ?? 0,
        "minutes",
        SMART_TARGETS.find((t) => t.id === "ttfhw")),
    );
  }

  return kpis;
}

function createKpi(
  id: string,
  label: string,
  value: number,
  previous: number,
  format: DashboardKpi["format"],
  target?: SmartTarget,
): DashboardKpi {
  const delta = value - previous;
  const deltaPct = previous === 0 ? 0 : delta / previous;
  return {
    id,
    label,
    value,
    previous,
    delta,
    deltaPct,
    trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    format,
    target,
  };
}

function sumRepoField(s: MetricSnapshot, field: keyof MetricSnapshot["github"]["repos"][string]): number {
  if (!s.github?.repos) return 0;
  return Object.values(s.github.repos).reduce((sum, r) => sum + (r?.[field] ?? 0), 0);
}

function sumDependents(s: MetricSnapshot): number {
  if (s.dependents) {
    return Object.values(s.dependents).reduce(
      (sum, d) => sum + (d?.rust ?? 0) + (d?.npm ?? 0),
      0,
    );
  }
  // Fallback for old data that has dependents on repo objects
  if (!s.github?.repos) return 0;
  return Object.values(s.github.repos).reduce((sum, r) => sum + (r?.dependents ?? 0), 0);
}

function sumNpm(s: MetricSnapshot): number {
  if (!s.npm) return 0;
  return Object.values(s.npm).reduce((sum, n) => sum + (n?.weekly ?? 0), 0);
}

function sumCratesRecent(s: MetricSnapshot): number {
  if (!s.crates) return 0;
  return Object.values(s.crates).reduce((sum, c) => sum + (c?.recent ?? 0), 0);
}

/* -----------------------------------------------------------------------
   Formatters (shared with UI)
   ----------------------------------------------------------------------- */

export function formatInt(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
