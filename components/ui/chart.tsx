"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

type TooltipPayloadEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
  color?: string;
};

type LegendPayloadEntry = {
  dataKey?: string | number;
  value?: string | number;
  color?: string;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used inside <ChartContainer />");
  }
  return context;
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorEntries = Object.entries(config).filter(([, value]) => value.color);
  if (!colorEntries.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        [data-chart="${id}"] {
          ${colorEntries.map(([key, value]) => `--color-${key}: ${value.color};`).join("\n")}
        }
      `,
      }}
    />
  );
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
};

function ChartContainer({ id, className, children, config, ...props }: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        data-chart={chartId}
        suppressHydrationWarning
        className={cn("h-[280px] w-full animate-pulse rounded-lg bg-muted/35", className)}
        {...props}
      />
    );
  }

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "h-[280px] w-full [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/40 [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border/40 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border/40 [&_.recharts-text]:fill-muted-foreground/90",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={{ width: 400, height: 280 }}>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: React.ReactNode;
  className?: string;
  hideLabel?: boolean;
  formatLabel?: (label: React.ReactNode) => React.ReactNode;
};

function ChartTooltipContent({
  active,
  payload,
  className,
  hideLabel = false,
  label,
  formatLabel,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  const formattedLabel = formatLabel ? formatLabel(label) : label;

  return (
    <div className={cn("min-w-[10rem] rounded-lg border border-border bg-popover/95 p-3 text-xs shadow-md", className)}>
      {!hideLabel && <div className="mb-2 font-medium text-popover-foreground">{formattedLabel}</div>}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const item = entry as TooltipPayloadEntry;
          const key = String(item.dataKey ?? item.name ?? "");
          const itemConfig = config[key];
          const dotColor = item.color || itemConfig?.color || "var(--color-brand)";
          return (
            <div key={`${key}-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: dotColor }} />
                <span className="text-muted-foreground">{itemConfig?.label ?? item.name ?? key}</span>
              </div>
              <span className="font-semibold text-popover-foreground">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

type ChartLegendContentProps = React.ComponentProps<"div"> & {
  payload?: LegendPayloadEntry[];
  verticalAlign?: "top" | "bottom" | "middle";
};

function ChartLegendContent({ payload, className }: ChartLegendContentProps) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 pt-2 text-xs", className)}>
      {payload.map((entry, index) => {
        const item = entry as TooltipPayloadEntry;
        const key = String(item.dataKey ?? item.value ?? "");
        const itemConfig = config[key];
        const dotColor = item.color || itemConfig?.color || "var(--color-brand)";
        return (
          <div key={`${key}-${index}`} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: dotColor }} />
            <span className="text-muted-foreground">{itemConfig?.label ?? item.value ?? key}</span>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };
