"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStamp } from "../../cohorts/cohorts-model";
import type { RunHistoryRow } from "../brand-model";

function statusBadge(status: string) {
  const good = status === "ok" || status === "complete" || status === "ready";
  return (
    <Badge variant="outline" className={cn("h-6 rounded-full px-2.5 text-[11px] font-medium", good && "border-emerald-200 bg-emerald-50 text-emerald-700")}>
      {good ? <CheckCircle2 className="mr-1 size-3" /> : <Clock3 className="mr-1 size-3" />}
      {status}
    </Badge>
  );
}

export function HistoryTab({ rows }: { rows: RunHistoryRow[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4 text-accent" />
          Run history
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.runId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{formatStamp(row.requestedAt)}</span>
                    {statusBadge(row.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{row.claimCount} claims</span>
                    <span>{row.topHook ? `Top hook: ${row.topHook.replaceAll("_", " ")}` : "No hook tags"}</span>
                    <span>{row.topFunnel ? `Top funnel: ${row.topFunnel.replaceAll("_", " ")}` : "No funnel tags"}</span>
                    {row.llmTokenCount !== null || row.llmCostUsd !== null ? (
                      <span className="font-mono">
                        {row.llmTokenCount !== null ? `${row.llmTokenCount.toLocaleString()} tokens` : ""}
                        {row.llmTokenCount !== null && row.llmCostUsd !== null ? " · " : ""}
                        {row.llmCostUsd !== null ? `$${row.llmCostUsd.toFixed(2)}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Link href={`/runs/${row.runId}`} className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-accent hover:underline">
                  {row.runId.slice(-8)} <ArrowUpRight className="size-3" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No runs stored for this brand yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
