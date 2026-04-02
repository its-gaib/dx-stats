import { readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { cache } from "react";
import type { MetricsSource } from "@/lib/data/source";
import type { DateRangeFilter, MetricSnapshot } from "@/lib/data/types";

const DEFAULT_FILE_PATH = "data/metrics.yaml";

const parseYamlFile = cache(async (absolutePath: string): Promise<MetricSnapshot[]> => {
  let content: string;
  try {
    content = await readFile(absolutePath, "utf8");
  } catch {
    console.warn("[YamlMetricsSource] File not found:", absolutePath);
    return [];
  }

  const data = yaml.load(content);
  if (!Array.isArray(data)) return [];

  return (data as MetricSnapshot[])
    .filter((entry) => entry && typeof entry.date === "string")
    .sort((a, b) => a.date.localeCompare(b.date));
});

export function createYamlMetricsSource(filePath?: string): MetricsSource {
  const absoluteFilePath = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", path.basename(filePath ?? DEFAULT_FILE_PATH));

  return {
    async getMetrics(range?: DateRangeFilter) {
      const records = await parseYamlFile(absoluteFilePath);
      return filterByDateRange(records, range);
    },

    async getLatestMetric() {
      const records = await parseYamlFile(absoluteFilePath);
      if (!records.length) return null;
      return records[records.length - 1];
    },
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
