"use client";

import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis } from "recharts";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useRef, type ReactNode } from "react";
import NumberFlow, { continuous, type Format } from "@number-flow/react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import type { DashboardData, DashboardKpi } from "@/lib/data/metrics-service";
import { SMART_TARGETS } from "@/lib/targets";
import { MILESTONES, type Milestone } from "@/lib/milestones";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* -----------------------------------------------------------------------
   Palette
   ----------------------------------------------------------------------- */

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

/* -----------------------------------------------------------------------
   Main view
   ----------------------------------------------------------------------- */

type Props = { data: DashboardData };

export function DashboardView({ data }: Props) {
  const [heroRef, heroVisible] = useInView();
  const [starsRef, starsVisible] = useInView();
  const [npmRef, npmVisible] = useInView();
  const [cratesRef, cratesVisible] = useInView();
  const [healthRef, healthVisible] = useInView();

  if (!data.flatPoints.length || !data.latest) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <p className="text-lg text-muted-foreground">No data available yet.</p>
      </div>
    );
  }

  const milestonePositions = getMilestonePositions(data.flatPoints);
  const av = (visible: boolean, n: number) => (visible ? n : 0);

  const latestFlat = data.flatPoints[data.flatPoints.length - 1];

  return (
    <div className="flex flex-col">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:px-6 lg:pt-32 lg:pb-24">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand/8 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 top-20 h-[400px] w-[400px] rounded-full bg-brand/5 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-[1200px] text-center">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Developer Experience
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Pubky <span className="text-brand">DX</span> Metrics
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Tracking developer adoption across the Pubky ecosystem.
          </p>

          {data.startDate && data.endDate && (
            <div className="mt-8 flex justify-center">
              <Badge variant="brand">
                {formatDate(data.startDate)} — {formatDate(data.endDate)}
              </Badge>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          BIG NUMBERS
          ═══════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="border-t border-border/30 bg-card/40 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <BigStat
            value={av(heroVisible, latestFlat.github_total_stars as number)}
            format={numFmt(latestFlat.github_total_stars as number)}
            label="GitHub Stars"
            accent
          />
          <BigStat
            value={av(heroVisible, latestFlat.npm_total_weekly as number)}
            format={numFmt(latestFlat.npm_total_weekly as number)}
            label="npm DL/week"
          />
          <BigStat
            value={av(heroVisible, latestFlat.crates_total_recent as number)}
            format={numFmt(latestFlat.crates_total_recent as number)}
            label="Crates Downloads"
            accent
          />
          <BigStat
            value={av(heroVisible, latestFlat.github_total_dependents as number)}
            format={numFmt(latestFlat.github_total_dependents as number)}
            label="Dependents"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SMART GOAL TARGETS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Goals
          </p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            SMART <span className="text-brand">targets</span>
          </h2>
          <p className="mt-3 max-w-lg text-base text-muted-foreground">
            Progress toward 2026 DevRel goals.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SMART_TARGETS.map((target) => {
              const current = getCurrentForTarget(target, data);
              return (
                <TargetCard key={target.id} target={target} current={current} />
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          GITHUB STARS OVER TIME
          ═══════════════════════════════════════════════════════════════════ */}
      <section ref={starsRef} className="border-t border-border/30 bg-card/40 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            GitHub
          </p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            <NumberFlow
              value={av(starsVisible, latestFlat.github_total_stars as number)}
              format={numFmt(latestFlat.github_total_stars as number)}
              trend={1}
              plugins={[continuous]}
              className="inline"
            />{" "}
            <span className="text-muted-foreground font-semibold text-2xl sm:text-3xl">
              total stars
            </span>
          </h2>

          <ChartReveal height={320} className="relative mt-10">
            <MultiAreaChart
              data={data.flatPoints}
              keys={data.repoNames.map((r) => `stars_${r}`)}
              labels={data.repoNames}
              height={320}
            />
            <MilestoneMarkers positions={milestonePositions} />
          </ChartReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          NPM DOWNLOADS
          ═══════════════════════════════════════════════════════════════════ */}
      <section ref={npmRef} className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            npm
          </p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            <NumberFlow
              value={av(npmVisible, latestFlat.npm_total_weekly as number)}
              format={numFmt(latestFlat.npm_total_weekly as number)}
              trend={1}
              plugins={[continuous]}
              className="inline"
            />{" "}
            <span className="text-muted-foreground font-semibold text-2xl sm:text-3xl">
              weekly downloads
            </span>
          </h2>

          <ChartReveal height={320} className="relative mt-10">
            <MultiLineChart
              data={data.flatPoints}
              keys={data.npmPackages.map((p) => `npm_${p.replace(/[@/]/g, "_")}`)}
              labels={data.npmPackages}
              height={320}
            />
            <MilestoneMarkers positions={milestonePositions} />
          </ChartReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CRATES.IO DOWNLOADS
          ═══════════════════════════════════════════════════════════════════ */}
      <section ref={cratesRef} className="border-t border-border/30 bg-card/40 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            crates.io
          </p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            <NumberFlow
              value={av(cratesVisible, latestFlat.crates_total_recent as number)}
              format={numFmt(latestFlat.crates_total_recent as number)}
              trend={1}
              plugins={[continuous]}
              className="inline"
            />{" "}
            <span className="text-muted-foreground font-semibold text-2xl sm:text-3xl">
              recent downloads
            </span>
          </h2>

          <ChartReveal height={320} className="relative mt-10">
            <MultiBarChart
              data={data.flatPoints}
              keys={data.crateNames.map((c) => `crate_recent_${c}`)}
              labels={data.crateNames}
              height={320}
            />
            <MilestoneMarkers positions={milestonePositions} />
          </ChartReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          GITHUB HEALTH
          ═══════════════════════════════════════════════════════════════════ */}
      <section ref={healthRef} className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Ecosystem
          </p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Health <span className="text-brand">signals</span>
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              value={av(healthVisible, latestFlat.github_total_forks as number)}
              format={numFmt(latestFlat.github_total_forks as number)}
              label="Total forks"
            />
            <StatCard
              value={av(healthVisible, latestFlat.github_total_open_issues as number)}
              format={numFmt(latestFlat.github_total_open_issues as number)}
              label="Open issues"
            />
            <StatCard
              value={av(healthVisible, latestFlat.github_org_followers as number)}
              format={numFmt(latestFlat.github_org_followers as number)}
              label="Org followers"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MANUAL KPIs
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-border/30 bg-card/40 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Manual KPIs
          </p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Tracked <span className="text-brand">manually</span>
          </h2>
          <p className="mt-3 max-w-lg text-base text-muted-foreground">
            These metrics require manual data entry.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ManualKpiCard
              label="TTFHW"
              value={data.latest?.manual?.ttfhw_minutes}
              unit="min"
            />
            <ManualKpiCard
              label="Active Builders"
              value={data.latest?.manual?.active_builders}
            />
            <ManualKpiCard
              label="Community Projects"
              value={data.latest?.manual?.community_projects}
            />
            <ManualKpiCard
              label="Homeserver Nodes"
              value={data.latest?.manual?.homeserver_nodes}
            />
            <ManualKpiCard
              label="Docs Visitors/month"
              value={data.latest?.manual?.docs_monthly_visitors}
            />
            <ManualKpiCard
              label="Bounty Completion"
              value={data.latest?.manual?.bounty_completion_rate}
              unit="%"
            />
            <ManualKpiCard
              label="Events Attended"
              value={data.latest?.manual?.events_attended}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          KPI DELTAS
          ═══════════════════════════════════════════════════════════════════ */}
      {data.kpis.length > 0 && (
        <section className="px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-[1200px]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Trends
            </p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Day over <span className="text-brand">day</span>
            </h2>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.kpis.map((kpi) => (
                <KpiDeltaCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border/30 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 sm:flex-row">
          <img src={`${basePath}/pubky-logo.svg`} alt="Pubky" width={80} height={26} />
          <p className="text-xs text-muted-foreground">
            Synonym Software, S.A. DE C.V. &copy;{new Date().getFullYear()}.
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Components
   ----------------------------------------------------------------------- */

function BigStat({
  value,
  label,
  accent,
  format,
}: {
  value: number;
  label: string;
  accent?: boolean;
  format?: Format;
}) {
  return (
    <div className="text-center">
      <NumberFlow
        value={value}
        format={format}
        trend={1}
        plugins={[continuous]}
        willChange
        className={`text-5xl font-extrabold tabular-nums tracking-tight sm:text-6xl lg:text-7xl ${
          accent ? "text-brand" : "text-foreground"
        }`}
      />
      <p className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function StatCard({
  value,
  label,
  format,
}: {
  value: number;
  label: string;
  format?: Format;
}) {
  return (
    <div className="rounded-2xl border border-border/30 bg-background/60 px-6 py-8 text-center">
      <NumberFlow
        value={value}
        format={format}
        trend={1}
        plugins={[continuous]}
        willChange
        className="text-3xl font-extrabold tabular-nums tracking-tight text-brand sm:text-4xl"
      />
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function TargetCard({
  target,
  current,
}: {
  target: typeof SMART_TARGETS[number];
  current: number | null;
}) {
  const progress = current != null
    ? target.lowerIsBetter
      ? Math.min(1, Math.max(0, (target.baseline - current) / (target.baseline - target.target)))
      : Math.min(1, Math.max(0, (current - target.baseline) / (target.target - target.baseline)))
    : 0;

  const pct = Math.round(progress * 100);
  const statusColor = pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="rounded-2xl border border-border/30 bg-background/60 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{target.label}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">
            {current != null ? current.toLocaleString() : "—"}
            <span className="ml-1 text-sm font-normal text-muted-foreground">{target.unit}</span>
          </p>
        </div>
        <Target className="size-5 text-muted-foreground" />
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{target.baseline.toLocaleString()}</span>
          <span>{target.target.toLocaleString()}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/50">
          <div
            className={`h-2 rounded-full transition-all ${statusColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="text-muted-foreground">{pct}% complete</span>
          <span className="text-muted-foreground">{target.deadline}</span>
        </div>
      </div>
    </div>
  );
}

function ManualKpiCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null | undefined;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/30 bg-background/60 px-6 py-6 text-center">
      {value != null ? (
        <p className="text-3xl font-extrabold tabular-nums text-brand">
          {value.toLocaleString()}{unit && <span className="text-lg ml-0.5">{unit}</span>}
        </p>
      ) : (
        <p className="text-lg text-muted-foreground/60">No data yet</p>
      )}
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function KpiDeltaCard({ kpi }: { kpi: DashboardKpi }) {
  const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;
  const trendColor = kpi.trend === "up" ? "text-emerald-400" : kpi.trend === "down" ? "text-red-400" : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border/30 bg-background/60 p-6">
      <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{kpi.value.toLocaleString()}</p>
      <div className={`mt-2 flex items-center gap-1.5 text-sm ${trendColor}`}>
        <TrendIcon className="size-4" />
        <span>
          {kpi.delta >= 0 ? "+" : ""}{kpi.delta.toLocaleString()}
          {kpi.deltaPct !== 0 && ` (${(kpi.deltaPct * 100).toFixed(1)}%)`}
        </span>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Charts
   ----------------------------------------------------------------------- */

function MultiAreaChart({
  data,
  keys,
  labels,
  height = 280,
}: {
  data: object[];
  keys: string[];
  labels: string[];
  height?: number;
}) {
  const config = Object.fromEntries(
    keys.map((k, i) => [k, { label: labels[i], color: CHART_COLORS[i % CHART_COLORS.length] }]),
  );

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <AreaChart data={data}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={60} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent formatLabel={shortDate} />} />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((k, i) => (
          <Area key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} fill={`url(#g-${k})`} dot={false} stackId="1" />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

function MultiLineChart({
  data,
  keys,
  labels,
  height = 280,
}: {
  data: object[];
  keys: string[];
  labels: string[];
  height?: number;
}) {
  const config = Object.fromEntries(
    keys.map((k, i) => [k, { label: labels[i], color: CHART_COLORS[i % CHART_COLORS.length] }]),
  );

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <LineChart data={data}>
        <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={60} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent formatLabel={shortDate} />} />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((k, i) => (
          <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5} dot={false} />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

function MultiBarChart({
  data,
  keys,
  labels,
  height = 280,
}: {
  data: object[];
  keys: string[];
  labels: string[];
  height?: number;
}) {
  const config = Object.fromEntries(
    keys.map((k, i) => [k, { label: labels[i], color: CHART_COLORS[i % CHART_COLORS.length] }]),
  );

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={data}>
        <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={60} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent formatLabel={shortDate} />} />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

/* -----------------------------------------------------------------------
   Milestone markers
   ----------------------------------------------------------------------- */

function getMilestonePositions(data: { date: string }[]) {
  if (!data.length) return [];
  return MILESTONES.map((m) => {
    const idx = data.findIndex((d) => d.date === m.date);
    if (idx === -1) return null;
    return { ...m, pct: (idx / (data.length - 1)) * 100 };
  }).filter(Boolean) as (Milestone & { pct: number })[];
}

function MilestoneMarkers({
  positions,
}: {
  positions: (Milestone & { pct: number })[];
}) {
  if (!positions.length) return null;
  return (
    <>
      {positions.map((m) => (
        <div
          key={m.date}
          className="pointer-events-none absolute top-0 bottom-[28px]"
          style={{ left: `${m.pct}%` }}
        >
          <div
            className="h-full w-px"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, var(--color-brand, #a3e635) 0 4px, transparent 4px 8px)",
              opacity: 0.5,
            }}
          />
          <div
            className="absolute top-0 rounded-full px-3 py-1"
            style={{
              right: 8,
              backgroundColor: "oklch(0.928 0.23 123.978 / 0.12)",
              border: "1px solid oklch(0.928 0.23 123.978 / 0.3)",
            }}
          >
            <span
              className="whitespace-nowrap text-[10px] font-bold tracking-wide"
              style={{ color: "oklch(0.928 0.23 123.978)" }}
            >
              {m.label}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

/* -----------------------------------------------------------------------
   Helpers
   ----------------------------------------------------------------------- */

function getCurrentForTarget(
  target: typeof SMART_TARGETS[number],
  data: DashboardData,
): number | null {
  const latest = data.latest;
  if (!latest) return null;

  const latestFlat = data.flatPoints[data.flatPoints.length - 1];

  switch (target.id) {
    case "github_stars":
      return latestFlat.github_total_stars as number;
    case "npm_monthly":
      return (latestFlat.npm_total_weekly as number) * 4;
    case "crates_monthly": {
      const pkarrDays = 90;
      const dailyRate = (latest.crates?.pkarr?.recent ?? 0) / pkarrDays;
      const pubkyDailyRate = (latest.crates?.pubky?.recent ?? 0) / pkarrDays;
      return Math.round((dailyRate + pubkyDailyRate) * 30);
    }
    case "dependents":
      return latestFlat.github_total_dependents as number;
    case "active_builders":
      return latest.manual?.active_builders ?? null;
    case "ttfhw":
      return latest.manual?.ttfhw_minutes ?? null;
    default:
      return null;
  }
}

function useInView(
  threshold = 0.15,
): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function ChartReveal({
  children,
  height,
  className,
}: {
  children: ReactNode;
  height: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ minHeight: height }}>
      {visible ? children : null}
    </div>
  );
}

function numFmt(value: number) {
  return value >= 10_000
    ? { notation: "compact" as const, maximumFractionDigits: 1 }
    : { maximumFractionDigits: 0 };
}

function formatDate(value: string | null): string {
  if (!value) return "";
  return format(new Date(value), "MMM d, yyyy");
}

function shortDate(value: ReactNode): string {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    !(value instanceof Date)
  ) {
    return "";
  }
  return format(new Date(value), "MMM d");
}
