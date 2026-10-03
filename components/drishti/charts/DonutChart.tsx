"use client";

import type { ReactNode } from "react";
import { PieChart as RechartIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { EmptyState } from "../EmptyState";
import { MetricInfo } from "../MetricInfo";
import { Panel } from "../Panel";
import { categoricalColorFor, iconProps } from "../tokens";

export type ChartCountRow = { label: string; count: number };

export function DonutChart({ title, definition, rows, emptyTitle, emptyDescription, colorFor }: { title: string; /** Plain-language explanation of what this count measures, rendered as a `?` beside the title. */ definition?: ReactNode; rows: ChartCountRow[]; emptyTitle: string; emptyDescription: string; colorFor?: (label: string) => string }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const colorForLabel = colorFor ?? categoricalColorFor;
  const reduceMotion = useReducedMotion();
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          {definition ? <MetricInfo label={title} definition={definition} /> : title}
        </h3>
        {rows.length > 0 ? <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{rows.length} categories</span> : null}
      </div>
      <div className="p-4">
        {rows.length === 0 || total <= 0 ? (
          <EmptyState size="sm" icon={<RechartIcon {...iconProps} size={16} />} title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ChartContainer config={{ count: { label: title } }} className="mx-auto aspect-square w-full max-w-[220px]">
              <PieChart accessibilityLayer>
                <Tooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={rows.map((row) => ({ ...row, fill: colorForLabel(row.label) }))} dataKey="count" nameKey="label" innerRadius={52} outerRadius={88} strokeWidth={2} stroke="var(--bg-raised)" isAnimationActive={!reduceMotion}>
                  {rows.map((row) => (
                    <Cell key={row.label} fill={colorForLabel(row.label)} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {rows.map((row) => (
                <li key={row.label} className="flex items-center gap-2 text-[13px]">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorForLabel(row.label) }} />
                  <span className="min-w-0 flex-1 truncate text-fg">{row.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-fg">{row.count}</span>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{Math.round((row.count / total) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* This chart draws whatever `rows` it is bound to, sometimes a
            tagged sample, sometimes another bounded slice, and has no way to
            know which from a label+count pair alone. So the denominator line
            names only what is provably true here: the real count these
            shares divide by is the rows bound to THIS chart, never implied
            to be the brand's whole findings set (docs/HANDOFF.md §2). */}
        {rows.length > 0 && total > 0 ? (
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            Shares are of the <span className="font-mono tabular-nums text-fg">{total}</span> counted here, not of anything beyond these rows.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
