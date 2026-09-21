"use client";


import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { SkeletonRows } from "../Skeleton";
import { LABEL_CLASS, VALUE_CLASS } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";
import type { EngineCoverageRow } from "./brand-model";

export type EngineCoverageProps = {
  rows: EngineCoverageRow[];
  isLoading?: boolean;
  className?: string;
};

const STATUS_LABEL: Record<EngineCoverageRow["status"], string> = {
  ok: "ok",
  unavailable: "unavailable",
  failed: "failed",
  not_run: "did not run",
};

export function engineCoverageSummary(rows: EngineCoverageRow[]): string {
  const ok = rows.filter((row) => row.status === "ok").length;
  return `${ok} of ${rows.length} returned data`;
}

export function EngineCoverage({
  rows,
  isLoading = false,
  className,
}: EngineCoverageProps) {
  return (
    <Panel
      as="section"
      interactive={false}
      padded
      ariaLabel="Engine coverage"
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
          Engine coverage
        </h3>
        {!isLoading && rows.length > 0 ? (
          <span className={cn(VALUE_CLASS, "text-[11.5px] text-[var(--text-tertiary,#64646f)]")}>
            {engineCoverageSummary(rows)}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <SkeletonRows count={5} variant="row" height={36} />
      ) : rows.length === 0 ? (
        <EmptyState
          size="sm"
          bounded
          title="No engines ran in this run."
          description="Engine coverage appears after a run fetches this brand. A run that stored nothing names the engines that did not return."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border,#24242f)]">
          {rows.map((row) => (
            <li
              key={row.engine}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn(LABEL_CLASS, "break-words text-[var(--text-primary,#eeeef2)]")}>
                  {row.label}
                </span>
                {row.reason !== null ? (
                  <span className="text-[12px] leading-[1.45] text-[var(--text-tertiary,#64646f)]">
                    {row.reason}
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-3">
                {row.fetchedAt !== null ? (
                  <span className={cn(VALUE_CLASS, "text-[10.5px] text-[var(--text-tertiary,#64646f)]")}>
                    {formatStamp(row.fetchedAt)}
                  </span>
                ) : null}
                <Chip label={STATUS_LABEL[row.status]} tone={row.tone} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
