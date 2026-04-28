import type { MetricSnapshot } from "@/lib/data/types";

const DEFAULT_METRICS_URL = "https://its-gaib.github.io/dx-stats-data/metrics.json";

export const METRICS_URL = process.env.NEXT_PUBLIC_METRICS_URL ?? DEFAULT_METRICS_URL;

export async function fetchMetrics(signal?: AbortSignal): Promise<MetricSnapshot[]> {
  const res = await fetch(METRICS_URL, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`metrics fetch failed: ${res.status} ${res.statusText}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("metrics payload is not an array");
  return (data as MetricSnapshot[])
    .filter((entry) => entry && typeof entry.date === "string")
    .sort((a, b) => a.date.localeCompare(b.date));
}
