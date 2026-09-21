"use client";


import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { EmptyState } from "../EmptyState";
import { SkeletonRows } from "../Skeleton";
import { LABEL_CLASS, VALUE_CLASS } from "../tokens";
import { formatStamp, freshnessTone } from "../cohorts/cohorts-model";
import { runStatusLabel } from "../cohorts/cohorts-model";
import { engineLabel, type RunHistoryRow } from "./brand-model";

export type HistoryPanelProps = {
  rows: RunHistoryRow[];
  isLoading?: boolean;
  className?: string;
};

function measure(value: string | number | null, unit?: string): string {
  if (value === null) return "not reported";
  return unit === undefined ? String(value) : `${value} ${unit}`;
}

export function HistoryPanel({
  rows,
  isLoading = false,
  className,
}: HistoryPanelProps) {
  if (isLoading) {
    return <SkeletonRows count={3} variant="block" height={120} className={className} />;
  }

  if (rows.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          size="sm"
          bounded
          title="No runs stored for this brand yet."
          description="Each completed run adds one row here, so the change between two runs becomes legible without leaving the page."
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {rows.map((row) => (
        <article
          key={row.runId}
          className="flex flex-col gap-3 rounded-[10px] border border-[var(--border,#24242f)] bg-[var(--bg-raised,#131319)] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span className={cn(VALUE_CLASS, "text-[12.5px] text-[var(--text-primary,#eeeef2)]")}>
              {formatStamp(row.requestedAt)}
            </span>
            <Chip
              label={runStatusLabel(row.status)}
              tone={freshnessTone(row.status)}
            />
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 min-[640px]:grid-cols-3 min-[1200px]:grid-cols-6">
            <div>
              <dt className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
                claims
              </dt>
              <dd className={cn(VALUE_CLASS, "mt-1 text-[13px] text-[var(--text-primary,#eeeef2)]")}>
                {row.claimCount}
              </dd>
            </div>
            <div>
              <dt className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
                top hook
              </dt>
              <dd className={cn(LABEL_CLASS, "mt-1 break-words text-[var(--text-primary,#eeeef2)]")}>
                {row.topHook ?? "not reported"}
              </dd>
            </div>
            <div>
              <dt className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
                top funnel
              </dt>
              <dd className={cn(LABEL_CLASS, "mt-1 break-words text-[var(--text-primary,#eeeef2)]")}>
                {row.topFunnel ?? "not reported"}
              </dd>
            </div>
            <div>
              <dt className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
                searches
              </dt>
              <dd className={cn(VALUE_CLASS, "mt-1 text-[13px] text-[var(--text-primary,#eeeef2)]")}>
                {measure(row.requestCount)}
              </dd>
            </div>
            <div>
              <dt className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
                tokens
              </dt>
              <dd className={cn(VALUE_CLASS, "mt-1 text-[13px] text-[var(--text-primary,#eeeef2)]")}>
                {measure(row.llmTokenCount)}
              </dd>
            </div>
            <div>
              <dt className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
                model cost
              </dt>
              <dd className={cn(VALUE_CLASS, "mt-1 text-[13px] text-[var(--text-primary,#eeeef2)]")}>
                {row.llmCostUsd === null
                  ? "not reported"
                  : `$${row.llmCostUsd.toFixed(4)}`}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
              engines
            </span>
            {row.engines.length === 0 ? (
              <span className="text-[12.5px] text-[var(--text-tertiary,#64646f)]">
                no engine returned in this run
              </span>
            ) : (
              row.engines.map((engine) => (
                <Chip key={engine} label={engineLabel(engine)} />
              ))
            )}
          </div>
        </article>
      ))}

      <p className="text-[12px] leading-[1.45] text-[var(--text-tertiary,#64646f)]">
        Engine gaps are named on each run&apos;s coverage, never shown as a zero.
        Model cost is the run&apos;s stored spend; its exact or estimated provenance
        is recorded per run.
      </p>
    </div>
  );
}
