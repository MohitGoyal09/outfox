"use client";

import { EmptyState } from "../EmptyState";
import { MetricInfo } from "../MetricInfo";
import { Panel } from "../Panel";

export function CountListPanel({
  title,
  definition,
  icon,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  definition: string;
  icon: React.ReactNode;
  rows: { label: string; count: number }[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        {icon}
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo label={title} definition={definition} />
        </h3>
      </div>
      <div className="p-4">
        {rows.length === 0 ? (
          <EmptyState size="sm" icon={icon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate">{row.label}</span>
                <span className="font-mono tabular-nums text-muted-foreground">{Intl.NumberFormat("en-US").format(row.count)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
