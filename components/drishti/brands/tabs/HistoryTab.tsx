"use client";

import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricInfo } from "../../MetricInfo";
import { Panel } from "../../Panel";
import { EmptyState } from "../../EmptyState";
import { formatStamp } from "../../cohorts/cohorts-model";
import { hookName, stageName } from "@/components/drishti/labels";
import { statusLabel } from "../status-labels";
import type { RunHistoryRow } from "../brand-model";

export function runStatusTone(status: string): "ok" | "warn" | "danger" | "neutral" {
  if (status === "complete") return "ok";
  if (status === "partial") return "warn";
  if (status === "failed") return "danger";
  return "neutral";
}

const NODE_CLASS: Record<ReturnType<typeof runStatusTone>, string> = {
  ok: "border-fg bg-fg",
  warn: "border-warn bg-[linear-gradient(90deg,var(--warn)_50%,transparent_50%)]",
  danger: "border-danger bg-bg-raised",
  neutral: "border-weak bg-bg-raised motion-safe:animate-pulse",
};

const STATUS_TEXT: Record<ReturnType<typeof runStatusTone>, string> = {
  ok: "text-fg",
  warn: "text-warn",
  danger: "text-danger",
  neutral: "text-weak",
};

export function HistoryTab({ rows }: { rows: RunHistoryRow[] }) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <Panel.Header title={<MetricInfo
            label="Check history"
            definition="One row per stored check, newest first. “Findings” is how many pieces of evidence that check stored, top hook and top funnel are its most common real tags, and tokens and cost are what its tagging actually used."
          />} />
      <div className="p-4">
        {rows.length ? (
          <ol className="relative border-l border-border">
            {rows.map((row) => {
              const tone = runStatusTone(row.status);
              return (
                <li key={row.runId} className="relative pb-6 pl-6 last:pb-0">
                  <span aria-hidden className={cn("absolute -left-[5.5px] top-1 size-2.5 rounded-full border", NODE_CLASS[tone])} />
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{formatStamp(row.requestedAt)}</span>
                      <span className={cn("text-xs font-medium", STATUS_TEXT[tone])}>{statusLabel(row.status)}</span>
                    </div>
                    <Link href={`/runs/${row.runId}`} className="inline-flex shrink-0 items-center gap-1 text-xs text-fg hover:underline">
                      View check <ArrowRight className="size-3" />
                    </Link>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
                </li>
              );
            })}
          </ol>
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
