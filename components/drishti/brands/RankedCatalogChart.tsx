"use client";

import type { ReactNode } from "react";
import { Layers } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CategoryAxisTick } from "../charts/CategoryAxisTick";
import { EmptyState } from "../EmptyState";
import { MetricInfo } from "../MetricInfo";
import { Panel } from "../Panel";
import { categoricalColorFor, iconProps } from "../tokens";
import type { LabeledCount } from "./brand-model";

const YAXIS_WIDTH = 172;
const LABEL_BUDGET = 24;

export function RankedCatalogChart({ title, definition, rows, emptyTitle, emptyDescription, colorFor, formatLabel }: { title: string; /** Plain-language explanation of what this count measures — rendered as a `?` beside the title. */ definition?: ReactNode; rows: LabeledCount[]; emptyTitle: string; emptyDescription: string; colorFor?: (label: string) => string; /** Display-only transform for a raw stored label (e.g. a fixed hookType id) — `colorFor`/the chart's own grouping still key off the raw `label`, only the rendered text changes. */ formatLabel?: (label: string) => string }) {
  const colorForLabel = colorFor ?? categoricalColorFor;
  const top = rows.slice(0, 8).map((row) => ({
    ...row,
    displayLabel: formatLabel ? formatLabel(row.label) : row.label,
    fill: colorForLabel(row.label),
  }));
  const chartConfig = { count: { label: "Times assigned", color: "var(--accent)" } } satisfies ChartConfig;
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          {definition ? <MetricInfo label={title} definition={definition} /> : title}
        </h3>
        {rows.length > 0 ? <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{rows.length} distinct</span> : null}
      </div>
      <div className="p-4">
        {top.length === 0 ? (
          <EmptyState size="sm" icon={<Layers {...iconProps} size={16} />} title={emptyTitle} description={emptyDescription} />
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full aspect-auto">
            <BarChart accessibilityLayer data={top} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <YAxis dataKey="displayLabel" type="category" width={YAXIS_WIDTH} tickLine={false} axisLine={false} tick={CategoryAxisTick(LABEL_BUDGET)} interval={0} />
              <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08 }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={3} barSize={16}>
                {top.map((row) => <Cell key={row.label} fill={row.fill} />)}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </Panel>
  );
}
