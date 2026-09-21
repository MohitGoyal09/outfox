"use client";


import { CircleAlert, History, PencilLine, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { SkeletonRows } from "../Skeleton";
import { LABEL_CLASS, VALUE_CLASS, iconProps } from "../tokens";
import { FreshnessStamp } from "./FreshnessStamp";
import {
  cohortBoundText,
  MAX_RIVALS_PER_COHORT,
  runStatusLabel,
  type CohortSummary,
} from "./cohorts-model";

export type CohortListProps = {
  cohorts: CohortSummary[];
  nameById: Record<string, string>;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEdit?: (cohort: CohortSummary) => void;
  emptyAction?: React.ReactNode;
  className?: string;
};

export function cohortBrandNames(
  cohort: CohortSummary,
  nameById: Record<string, string>,
): string[] {
  return cohort.brandIds.map((id) => nameById[id] ?? id.slice(0, 8));
}

export function CohortList({
  cohorts,
  nameById,
  isLoading = false,
  error = null,
  onRetry,
  onEdit,
  emptyAction,
  className,
}: CohortListProps) {
  if (error !== null) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[var(--danger,#f87171)] p-4 text-[13px] leading-[1.5] text-[var(--danger,#f87171)]"
      >
        <CircleAlert {...iconProps} size={16} aria-hidden="true" className="size-4 shrink-0" />
        <span>{error}</span>
        {onRetry ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw {...iconProps} size={14} />}
          >
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  if (isLoading) {
    return (
      <SkeletonRows
        count={3}
        variant="block"
        height={72}
        className={className}
      />
    );
  }

  if (cohorts.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          bounded
          icon={<History {...iconProps} size={16} />}
          title="No cohort has run yet."
          description="A cohort is a set of rivals compared in one run. Pick the rivals below and open the cohort to create its first run."
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <ul
      aria-label="Cohorts"
      className={cn("divide-y divide-border border-y border-border", className)}
    >
      {cohorts.map((cohort) => {
        const names = cohortBrandNames(cohort, nameById);
        const href = `/compare/${encodeURIComponent(cohort.cohortKey)}`;
        return (
          <Panel as="li" key={cohort.cohortKey} padded className="flex flex-col gap-3 rounded-none border-0 border-b border-border bg-bg-raised px-3 py-4 last:border-b-0 hover:bg-bg-raised-2">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-medium text-fg">
                  {names.length === 0 ? "Unnamed rivals" : names.join(" · ")}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={cn(VALUE_CLASS, "text-[11.5px] text-fg-tertiary")}>
                    {cohort.runCount} {cohort.runCount === 1 ? "run" : "runs"}
                  </span>
                    <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>
                    {cohortBoundText(cohort.rivalCount, MAX_RIVALS_PER_COHORT)}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  label={runStatusLabel(cohort.status)}
                  tone={cohort.freshness}
                />
                <FreshnessStamp
                  at={cohort.latestAt}
                  tone={cohort.freshness}
                  caption="last run"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={href}
                className="inline-flex h-8 items-center gap-2 rounded-md bg-accent px-3 text-[13px] font-medium text-accent-ink hover:bg-accent-strong active:translate-y-[0.5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Open cohort
              </Link>
              {onEdit ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(cohort)}
                  icon={<PencilLine {...iconProps} size={14} />}
                >
                  Edit rivals
                </Button>
              ) : null}
            </div>
          </Panel>
        );
      })}
    </ul>
  );
}
