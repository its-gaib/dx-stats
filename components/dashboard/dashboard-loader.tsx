"use client";

import { useEffect, useState } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { fetchMetrics, METRICS_URL } from "@/lib/data/fetch-metrics";
import { computeDashboardData, type DashboardData } from "@/lib/data/metrics-service";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardData }
  | { status: "error"; message: string };

export function DashboardLoader() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchMetrics(controller.signal)
      .then((snapshots) => setState({ status: "ready", data: computeDashboardData(snapshots) }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <span className="animate-pulse">Loading metrics…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-destructive">Couldn’t load metrics.</p>
        <p className="text-xs text-muted-foreground">{state.message}</p>
        <p className="text-xs text-muted-foreground">
          Source: <a className="underline" href={METRICS_URL}>{METRICS_URL}</a>
        </p>
      </div>
    );
  }

  return <DashboardView data={state.data} />;
}
