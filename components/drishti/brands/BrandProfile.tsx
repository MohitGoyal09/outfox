"use client";


import { useMemo, useState } from "react";
import { Tag } from "lucide-react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

import { EmptyState } from "../EmptyState";
import { Skeleton, SkeletonRows } from "../Skeleton";
import { SegmentedNav, type SegmentedNavItem } from "../SegmentedNav";
import { iconProps } from "../tokens";
import { useAllRuns } from "../cohorts/useAllRuns";
import { BrandHeader } from "./BrandHeader";
import { BrandOverview } from "./BrandOverview";
import { EngineCoverage } from "./EngineCoverage";
import { HistoryPanel } from "./HistoryPanel";
import { MixPanel } from "./MixPanel";
import { SignalsPanel } from "./SignalsPanel";
import { TrendsPanel } from "./TrendsPanel";
import {
  claimsForRun,
  engineCoverage,
  latestRunForBrand,
  previousRunFor,
  runHistoryRows,
} from "./brand-model";

const TABS: SegmentedNavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "signals", label: "Signals" },
  { id: "hooks", label: "Hooks" },
  { id: "funnel", label: "Funnel" },
  { id: "trends", label: "Trends" },
  { id: "history", label: "History" },
];

export type BrandProfileProps = {
  brandId: Id<"brands">;
  className?: string;
};

export function BrandProfile({ brandId, className }: BrandProfileProps) {
  const [tab, setTab] = useState("overview");

  const brand = useQuery(api.brands.getBrand, { brandId });
  const claims = useQuery(api.claims.byBrand, { brandId });
  const { runs, isLoading: isLoadingRuns } = useAllRuns();

  const latestRun = useMemo(
    () => latestRunForBrand(runs, String(brandId)),
    [runs, brandId],
  );

  const snapshots = useQuery(
    api.snapshots.byRun,
    latestRun === null ? "skip" : { runId: latestRun._id },
  );
  const usage = useQuery(
    api.llmUsage.usageForRun,
    latestRun === null ? "skip" : { runId: latestRun._id },
  );
  const cohortLatest = useQuery(
    api.runs.latestForCohort,
    latestRun === null ? "skip" : { cohortKey: latestRun.cohortKey },
  );

  const claimList = useMemo(() => claims ?? [], [claims]);

  const latestClaims = useMemo(
    () => (latestRun === null ? [] : claimsForRun(claimList, String(latestRun._id))),
    [claimList, latestRun],
  );

  const previousRunId = useMemo(
    () => (latestRun === null ? null : previousRunFor(claimList, String(latestRun._id))),
    [claimList, latestRun],
  );

  const previousClaims = useMemo(
    () => (previousRunId === null ? [] : claimsForRun(claimList, previousRunId)),
    [claimList, previousRunId],
  );

  const previousRunAt = useMemo(() => {
    if (previousRunId === null) return null;
    const run = runs.find((candidate) => String(candidate._id) === previousRunId);
    if (run !== undefined) return run.requestedAt;
    const claim = previousClaims[0];
    return claim === undefined ? null : claim.fetchedAt;
  }, [previousRunId, runs, previousClaims]);

  const history = useMemo(
    () => runHistoryRows(runs, claimList),
    [runs, claimList],
  );

  const coverage = useMemo(
    () => engineCoverage(snapshots ?? [], String(brandId)),
    [snapshots, brandId],
  );

  const isLoading =
    brand === undefined ||
    claims === undefined ||
    isLoadingRuns ||
    (latestRun !== null && (snapshots === undefined || usage === undefined));

  if (brand === null) {
    return (
      <div className={className}>
        <EmptyState
          bounded
          icon={<Tag {...iconProps} size={16} />}
          title="This brand no longer exists."
          description="The record this profile pointed at was not found. Return to the brand list to pick a tracked rival."
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {brand === undefined ? (
        <div className="flex flex-col gap-4">
          <Skeleton variant="text" width="40%" height={22} />
          <Skeleton variant="text" width="24%" height={14} />
          <SkeletonRows count={1} variant="block" height={96} />
        </div>
      ) : (
        <BrandHeader
          brand={brand}
          latestAt={latestRun === null ? null : latestRun.requestedAt}
          latestStatus={latestRun === null ? null : latestRun.status}
        />
      )}

      <SegmentedNav
        items={TABS}
        value={tab}
        onChange={setTab}
        label="Brand profile sections"
        loading={brand === undefined}
      />

      {tab === "overview" ? (
        <>
          <BrandOverview
            claims={latestClaims}
            latestRun={latestRun}
            cohortLatest={cohortLatest ?? null}
            exactCostUsd={usage?.exactCostUsd ?? 0}
            estimatedCostUsd={usage?.estimatedCostUsd ?? 0}
            llmRequestCount={usage?.requests ?? 0}
            llmTokenCount={usage?.tokens ?? 0}
            runCount={history.length}
            onOpenSignals={() => setTab("signals")}
            isLoading={isLoading}
          />
          <EngineCoverage rows={coverage} isLoading={isLoading} />
        </>
      ) : tab === "signals" ? (
        <SignalsPanel claims={latestClaims} isLoading={isLoading} />
      ) : tab === "hooks" ? (
        <MixPanel
          kind="hook"
          claims={latestClaims}
          previousClaims={previousClaims}
          previousRunAt={previousRunAt}
          isLoading={isLoading}
        />
      ) : tab === "funnel" ? (
        <MixPanel
          kind="funnel"
          claims={latestClaims}
          previousClaims={previousClaims}
          previousRunAt={previousRunAt}
          isLoading={isLoading}
        />
      ) : tab === "trends" ? (
        <TrendsPanel claims={claimList} isLoading={isLoading} />
      ) : (
        <HistoryPanel rows={history} isLoading={isLoading} />
      )}
    </div>
  );
}
