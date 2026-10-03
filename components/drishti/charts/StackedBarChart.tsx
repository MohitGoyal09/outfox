"use client";

import type { ReactNode } from "react";
import { Layers } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { MetricInfo } from "../MetricInfo";
import { Panel } from "../Panel";
import { categoricalColorFor, iconProps } from "../tokens";
import type { ChartCountRow } from "./DonutChart";

export function StackedBarChart({ title, definition, rows, emptyTitle, emptyDescription, colorFor }: { title: string; /** Plain-language explanation of what this count measures, rendered as a `?` beside the title. */ definition?: ReactNode; rows: ChartCountRow[]; emptyTitle: string; emptyDescription: string; colorFor?: (label: string) => string }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const colorForLabel = colorFor ?? categoricalColorFor;
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          {definition ? <MetricInfo label={title} definition={definition} /> : title}
        </h3>
        {rows.length > 0 ? <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{total} total</span> : null}
      </div>
      <div className="space-y-3 p-4">
        {rows.length === 0 || total <= 0 ? (
          <EmptyState size="sm" icon={<Layers {...iconProps} size={16} />} title={emptyTitle} description={emptyDescription} />
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded-full" role="img" aria-label={`${title}: ${rows.map((row) => `${row.label} ${row.count}`).join(", ")}`}>
              {rows.map((row) => (
                <span
                  key={row.label}
                  style={{ width: `${(row.count / total) * 100}%`, backgroundColor: colorForLabel(row.label) }}
                  title={`${row.label}: ${row.count} (${Math.round((row.count / total) * 100)}%)`}
                />
              ))}
            </div>
            <ul className="space-y-1.5">
              {rows.map((row) => (
                <li key={row.label} className="flex items-center gap-2 text-[13px]">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorForLabel(row.label) }} />
                  <span className="min-w-0 flex-1 truncate text-fg">{row.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-fg">{row.count}</span>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{Math.round((row.count / total) * 100)}%</span>
                </li>
              ))}
            </ul>
            {/* Same reasoning as DonutChart.tsx: this bar composes whatever
                bounded `rows` it is handed, with no way to know if that is a
                tagged sample or some other slice, so the note names only the
                real, known denominator, these rows' own total, instead of
                letting a segment's `%` be read as a share of everything. */}
            <p className="text-[11px] leading-5 text-muted-foreground">
              Shares are of the <span className="font-mono tabular-nums text-fg">{total}</span> counted here, not of anything beyond these rows.
            </p>
          </>
        )}
      </div>
    </Panel>
  );
}
