"use client";

import { useQuery } from "convex/react";
import { History } from "lucide-react";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import {
  EmptyState,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            <History className="size-3.5" /> Research history
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">Runs</h1>
          <p className="mt-2 max-w-[62ch] text-sm leading-6 text-muted-foreground">
            Each run is a time-stamped evidence snapshot. Open one to inspect
            coverage, changes, costs, and the claims behind them.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-full bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">
            {runs.length} {runs.length === 1 ? "run" : "runs"}
          </Badge>
          {freshest === null ? null : <span className={cn(VALUE_CLASS, "text-[11px]")}>fresh {formatRunDateTime(freshest)}</span>}
        </div>
      </header>

      {loading ? (
        <SkeletonRows count={4} variant="row" height={96} />
      ) : runs.length === 0 ? (
        <Card className="border-dashed bg-card shadow-none">
          <CardContent className="p-8">
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
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Comparison runs">
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
