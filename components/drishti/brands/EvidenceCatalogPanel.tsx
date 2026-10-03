"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { MetricInfo } from "../MetricInfo";
import { Panel } from "../Panel";
import type { EvidenceCatalogRow } from "./brand-model";

export function EvidenceCatalogPanel({
  title,
  definition,
  icon,
  rows,
  emptyTitle,
  emptyDescription,
  capNote,
}: {
  title: string;
  definition: string;
  icon: ReactNode;
  rows: EvidenceCatalogRow[];
  emptyTitle: string;
  emptyDescription: string;
  capNote: string;
}) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        {icon}
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo label={title} definition={definition} />
        </h3>
        {rows.length > 0 ? (
          <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
            {rows.length} found
          </span>
        ) : null}
      </div>
      <div className="p-4">
        {rows.length === 0 ? (
          <EmptyState size="sm" icon={icon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <>
            <p className="mb-3 text-[10.5px] leading-4 text-muted-foreground">{capNote}</p>
            <ul className="space-y-2">
              {rows.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 flex-1 truncate" title={row.primary}>
                    <a
                      href={row.evidenceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-fg hover:underline"
                    >
                      {row.primary}
                    </a>
                    {row.meta !== null ? (
                      <span className="ml-1.5 tabular-nums text-muted-foreground">({row.meta})</span>
                    ) : null}
                  </span>
                  <ExternalLink className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Panel>
  );
}
