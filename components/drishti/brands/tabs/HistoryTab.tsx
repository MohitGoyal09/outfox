"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, History, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MetricInfo } from "../../MetricInfo";
import { Panel } from "../../Panel";
import { EmptyState } from "../../EmptyState";
import { formatStamp } from "../../cohorts/cohorts-model";
import { hookName, stageName } from "@/components/drishti/labels";
import type { RunHistoryRow } from "../brand-model";

export function runStatusTone(status: string): "ok" | "warn" | "danger" | "neutral" {
  if (status === "complete") return "ok";
  if (status === "partial") return "warn";
  if (status === "failed") return "danger";
  return "neutral";
}

const TONE_CLASS: Record<ReturnType<typeof runStatusTone>, string> = {
  ok: "border-ok/30 bg-ok/10 text-ok",
  warn: "border-warn/30 bg-warn/10 text-warn",
  danger: "border-danger/30 bg-danger/10 text-danger",
  neutral: "border-weak/30 bg-weak/10 text-weak",
};

const TONE_ICON: Record<ReturnType<typeof runStatusTone>, typeof CheckCircle2> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  danger: XCircle,
  neutral: Clock3,
};

function statusBadge(status: string) {
  const tone = runStatusTone(status);
  const Icon = TONE_ICON[tone];
  return (
    <Badge variant="outline" className={cn("h-6 rounded-full px-2.5 text-[11px] font-medium", TONE_CLASS[tone])}>
      <Icon className="mr-1 size-3" />
      {status}
    </Badge>
  );
}

export function HistoryTab({ rows }: { rows: RunHistoryRow[] }) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <History className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo
            label="Check history"
            definition="One row per stored check, newest first. “Findings” is how many pieces of evidence that check stored, top hook and top funnel are its most common real tags, and tokens and cost are what its tagging actually used."
          />
        </h3>
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
