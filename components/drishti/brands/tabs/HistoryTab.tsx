"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Panel } from "../../Panel";
import { EmptyState } from "../../EmptyState";
import { formatStamp } from "../../cohorts/cohorts-model";
import { hookName, stageName } from "@/components/drishti/labels";
import type { RunHistoryRow } from "../brand-model";

function statusBadge(status: string) {
  const good = status === "ok" || status === "complete" || status === "ready";
  return (
    <Badge variant="outline" className={cn("h-6 rounded-full px-2.5 text-[11px] font-medium", good ? "border-ok/30 bg-ok/10 text-ok" : "border-warn/30 bg-warn/10 text-warn")}>
      {good ? <CheckCircle2 className="mr-1 size-3" /> : <Clock3 className="mr-1 size-3" />}
      {status}
    </Badge>
  );
}

export function HistoryTab({ rows }: { rows: RunHistoryRow[] }) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <History className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">Check history</h3>
      </div>
      <div className="p-4">
        {rows.length ? (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.runId} className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border p-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{formatStamp(row.requestedAt)}</span>
                    {statusBadge(row.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{row.claimCount} findings</span>
                    <span>{row.topHook ? `Top hook: ${hookName(row.topHook)}` : "No hook tags"}</span>
                    <span>{row.topFunnel ? `Top funnel: ${stageName(row.topFunnel)}` : "No funnel tags"}</span>
                    {row.llmTokenCount !== null || row.llmCostUsd !== null ? (
                      <span className="font-mono">
                        {row.llmTokenCount !== null ? `${row.llmTokenCount.toLocaleString()} tokens` : ""}
                        {row.llmTokenCount !== null && row.llmCostUsd !== null ? " · " : ""}
                        {row.llmCostUsd !== null ? `$${row.llmCostUsd.toFixed(2)}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Link href={`/runs/${row.runId}`} className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-fg hover:underline">
                  {row.runId.slice(-8)} <ArrowUpRight className="size-3" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            size="sm"
            bounded
            icon={<History className="size-4" />}
            title="No checks stored for this brand yet."
            description="Every check of this brand is listed here, newest first, once one has run. Start a check to fill it in."
          />
        )}
      </div>
    </Panel>
  );
}
