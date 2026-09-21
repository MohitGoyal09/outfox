"use client";

import { CircleAlert, History, PencilLine, RefreshCw, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FreshnessStamp } from "./FreshnessStamp";
import { cohortBoundText, MAX_RIVALS_PER_COHORT, runStatusLabel, type CohortSummary } from "./cohorts-model";

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

function cohortBrandNames(cohort: CohortSummary, nameById: Record<string, string>): string[] {
  return cohort.brandIds.map((id) => nameById[id] ?? id.slice(0, 8));
}

export function CohortList({ cohorts, nameById, isLoading = false, error = null, onRetry, onEdit, emptyAction, className }: CohortListProps) {
  if (error !== null) {
    return <Card className={cn("border-danger/30 bg-card", className)} role="alert"><CardContent className="flex flex-wrap items-center gap-3 p-5 text-sm text-danger"><CircleAlert className="size-4 shrink-0" aria-hidden="true" /><span>{error}</span>{onRetry ? <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw className="size-3.5" aria-hidden="true" /> Retry</Button> : null}</CardContent></Card>;
  }
  if (isLoading) {
    return <div className={cn("space-y-3", className)} role="status" aria-label="Loading cohorts">{Array.from({ length: 3 }, (_, index) => <Card key={index} className="border-border bg-card"><CardContent className="space-y-3 p-5"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-8 w-28" /></CardContent></Card>)}</div>;
  }
  if (cohorts.length === 0) {
    return <Card className={cn("border-dashed border-border bg-card", className)}><CardContent className="flex flex-col items-start gap-3 p-6 sm:p-8"><span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><History className="size-4" aria-hidden="true" /></span><div><h3 className="font-heading text-base font-medium text-foreground">No cohort has run yet.</h3><p className="mt-1 max-w-[54ch] text-sm leading-6 text-muted-foreground">Pick a set of rivals below. Drishti will keep the evidence tied to the run that created it.</p></div>{emptyAction ? <div className="pt-1">{emptyAction}</div> : null}</CardContent></Card>;
  }
  return <div className={cn("space-y-3", className)}>{cohorts.map((cohort) => { const names = cohortBrandNames(cohort, nameById); const href = `/compare/${encodeURIComponent(cohort.cohortKey)}`; const status = runStatusLabel(cohort.status); return <Card key={cohort.cohortKey} className="border-border bg-card transition-colors hover:border-border-strong"><CardHeader className="gap-3 p-5 pb-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><CardTitle className="truncate text-[15px] font-medium text-foreground">{names.length === 0 ? "Unnamed rivals" : names.join(" · ")}</CardTitle><p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span className="font-mono tabular-nums">{cohort.runCount} {cohort.runCount === 1 ? "run" : "runs"}</span><span>{cohortBoundText(cohort.rivalCount, MAX_RIVALS_PER_COHORT)}</span></p></div><div className="flex flex-wrap items-center gap-2"><Badge variant={cohort.freshness === "danger" ? "destructive" : "outline"} className={cn("capitalize", cohort.freshness === "ok" && "border-ok/30 bg-ok/10 text-ok", cohort.freshness === "warn" && "border-warn/30 bg-warn/10 text-warn")}>{status}</Badge><FreshnessStamp at={cohort.latestAt} tone={cohort.freshness} caption="last run" className="text-xs" /></div></CardHeader><CardContent className="flex flex-wrap items-center gap-2 p-5 pt-1"><Button asChild size="sm"><Link href={href}>Open cohort <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></Button>{onEdit ? <Button variant="ghost" size="sm" onClick={() => onEdit(cohort)}><PencilLine className="size-3.5" aria-hidden="true" /> Edit rivals</Button> : null}</CardContent></Card>; })}</div>;
}
