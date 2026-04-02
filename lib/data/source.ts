import { createYamlMetricsSource } from "@/lib/data/yaml-source";
import type { DateRangeFilter, MetricSnapshot } from "@/lib/data/types";

export interface MetricsSource {
  getMetrics(range?: DateRangeFilter): Promise<MetricSnapshot[]>;
  getLatestMetric(): Promise<MetricSnapshot | null>;
}

export function getMetricsSource(): MetricsSource {
  return createYamlMetricsSource();
}
