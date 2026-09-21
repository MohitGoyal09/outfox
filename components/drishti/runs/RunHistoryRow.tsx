"use client";

import { useQuery } from "convex/react";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import {
  Chip,
  Panel,
  Skeleton,
  TONE_COLOR,
  VALUE_CLASS,
} from "@/components/drishti";
import { cn } from "@/lib/utils";
import {
  COST_PROVENANCE_LABEL,
  RUN_STATUS_TONE,
  READOUT_SEPARATOR,
  costProvenance,
  engineCellTone,
  formatCount,
  formatRunDate,
  formatUsd,
  isTerminalRunStatus,
} from "./labels";
import { brandRefs, cohortLabel, engineGaps, engineRows } from "./derive";
import type { RunDoc, RunStatus } from "./types";

export type RunHistoryRowProps = {
  run: RunDoc;
  names: Map<string, string>;
};

export function RunHistoryRow({ run, names }: RunHistoryRowProps) {
  const snapshots = useQuery(api.snapshots.byRun, { runId: run._id });
  const usage = useQuery(api.llmUsage.usageForRun, { runId: run._id });
  const brands = brandRefs(run.brandIds, names);
  const gaps = engineGaps(engineRows(snapshots, brands));
  const provenance = costProvenance(usage?.exactCostUsd, usage?.estimatedCostUsd);
  const status: RunStatus = isTerminalRunStatus(run.status) ? run.status : "running";
  const costText =
    usage === undefined
      ? null
      : provenance === "unknown"
        ? "cost not reported"
        : `${formatUsd(usage.costUsd)} ${COST_PROVENANCE_LABEL[provenance]}`;

  return (
    <Panel as="li" className="p-0">
      <Link
        href={`/runs/${encodeURIComponent(String(run._id))}`}
        className="block rounded-[10px] p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={cn(
                  VALUE_CLASS,
                  "text-[12px] text-[var(--text-secondary,#9797a3)]",
                )}
              >
                {formatRunDate(run.requestedAt)}
              </span>
              <span className="text-[13.5px] font-medium text-[var(--text-primary,#eeeef2)]">
                {cohortLabel(run.brandIds, names)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span
                className={cn(
                  VALUE_CLASS,
                  "text-[12px] text-[var(--text-secondary,#9797a3)]",
                )}
              >
                {formatCount(run.requestCount)} {run.requestCount === 1 ? "search" : "searches"}
              </span>
              <span aria-hidden="true" className="text-[var(--text-tertiary,#64646f)]">
                {READOUT_SEPARATOR}
              </span>
              <span
                className={cn(
                  VALUE_CLASS,
                  "text-[12px] text-[var(--text-secondary,#9797a3)]",
                )}
              >
                {run.llmRequestCount === undefined
                  ? "model calls not reported"
                  : `${formatCount(run.llmRequestCount)} ${run.llmRequestCount === 1 ? "model call" : "model calls"}`}
              </span>
              <span aria-hidden="true" className="text-[var(--text-tertiary,#64646f)]">
                {READOUT_SEPARATOR}
              </span>
              {costText === null ? (
                <Skeleton variant="stat" width={68} height={12} />
              ) : (
                <span
                  className={cn(
                    VALUE_CLASS,
                    "text-[12px]",
                    provenance === "exact" || provenance === "mixed"
                      ? "text-[var(--ok,#4ade80)]"
                      : provenance === "estimated"
                        ? "text-[var(--warn,#fbbf24)]"
                        : "text-[var(--text-secondary,#9797a3)]",
                  )}
                >
                  {costText}
                </span>
              )}

              {snapshots === undefined ? (
                <>
                  <span aria-hidden="true" className="text-[var(--text-tertiary,#64646f)]">
                    {READOUT_SEPARATOR}
                  </span>
                  <Skeleton variant="stat" width={124} height={12} />
                </>
              ) : gaps.length === 0 ? null : (
                <>
                  <span aria-hidden="true" className="text-[var(--text-tertiary,#64646f)]">
                    {READOUT_SEPARATOR}
                  </span>
                  {gaps.map((gap) => (
                    <span
                      key={gap.engine}
                      className="inline-flex items-center gap-1.5"
                      title={gap.reason}
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: TONE_COLOR[engineCellTone(gap.status)] }}
                      />
                      <span
                        className={cn(
                          VALUE_CLASS,
                          "text-[12px] text-[var(--text-secondary,#9797a3)]",
                        )}
                      >
                        {gap.label} {gap.status === "failed" ? "failed" : gap.status === "missing" ? "not recorded" : "unavailable"}
                      </span>
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          <Chip tone={RUN_STATUS_TONE[status]} label={status} />
        </div>
      </Link>
    </Panel>
  );
}
