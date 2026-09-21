"use client";

import { useQuery } from "convex/react";
import { History } from "lucide-react";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import {
  EmptyState,
  Panel,
  SkeletonRows,
  VALUE_CLASS,
  buttonClasses,
  iconProps,
} from "@/components/drishti";
import {
  RunErrorBoundary,
  RunHistoryRow,
  brandNameMap,
  formatRunDateTime,
  mergeRuns,
  sortRunsNewestFirst,
} from "@/components/drishti/runs";
import { cn } from "@/lib/utils";

function RunsHistory() {
  const complete = useQuery(api.runs.listByStatus, { status: "complete" });
  const partial = useQuery(api.runs.listByStatus, { status: "partial" });
  const failed = useQuery(api.runs.listByStatus, { status: "failed" });
  const running = useQuery(api.runs.listByStatus, { status: "running" });
  const brands = useQuery(api.brands.listBrands);

  const runsLoaded =
    complete !== undefined &&
    partial !== undefined &&
    failed !== undefined &&
    running !== undefined;
  const runs = runsLoaded
    ? sortRunsNewestFirst(mergeRuns([complete, partial, failed, running]))
    : [];
  const names = brandNameMap(brands);
  const freshest = runs.length > 0 ? runs[0].requestedAt : null;
  const loading = !runsLoaded || brands === undefined;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="type-display text-[var(--text-primary,#eeeef2)]">Runs</h1>
          <p className="type-body measure-prose mt-1.5 text-[var(--text-secondary,#9797a3)]">
            A run compares every rival in a cohort at one moment. Open one to see
            what changed since the last comparison, the rival mixes, and every
            claim behind them.
          </p>
        </div>
        {freshest === null ? null : (
          <p
            className={cn(
              VALUE_CLASS,
              "text-[12px] text-[var(--text-secondary,#9797a3)]",
            )}
          >
            fresh as of {formatRunDateTime(freshest)}
          </p>
        )}
      </header>

      {loading ? (
        <SkeletonRows count={4} variant="row" height={96} />
      ) : runs.length === 0 ? (
        <Panel interactive={false} className="p-5">
          <EmptyState
            icon={<History {...iconProps} size={16} />}
            title="No run has been recorded yet."
            description="A run fetches each rival's public signals, stores a claim for every result, and writes the brief that cites them. Pick a cohort and run it to create the first comparison."
            action={
              <Link href="/cohorts" className={buttonClasses({ variant: "primary", size: "sm" })}>
                Choose a cohort
              </Link>
            }
          />
        </Panel>
      ) : (
        <ul className="flex flex-col gap-3">
          {runs.map((run) => (
            <RunHistoryRow key={run._id} run={run} names={names} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RunsPage() {
  return (
    <RunErrorBoundary subject="the run history">
      <RunsHistory />
    </RunErrorBoundary>
  );
}
