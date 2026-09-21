"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { buttonClasses } from "../Button";
import { DistributionPanel } from "../DistributionPanel";
import { EmptyState } from "../EmptyState";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { VALUE_CLASS, iconProps } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";
import { useAllRuns } from "../cohorts/useAllRuns";
import { BrandLeaderboard } from "./BrandLeaderboard";
import { EmergingMoves } from "./EmergingMoves";
import { EngineCoverage } from "./EngineCoverage";
import {
  BOARD_HONESTY_LINE,
  coverageGaps,
  deriveEmerging,
  deriveEngineCoverage,
  deriveFunnelDistribution,
  deriveHookDistribution,
  deriveLeaderboard,
  scopeCohortRuns,
} from "./board-model";

const EMPTY_DESCRIPTION =
  "A run is one comparison of a rival set at one moment. The board pools every rival in the cohort, so it appears once at least one run has finished.";

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionPanel items={[]} kind="hook" title="Top hooks across the cohort" loading />
        <DistributionPanel items={[]} kind="funnel" title="Funnel distribution" loading />
      </div>
      <SkeletonRegion label="Loading brand leaderboard" className="rounded-[10px] border border-[var(--border,#24242f)] p-4">
        <Skeleton variant="text" width="30%" height={12} />
        <span className="mt-4 block">
          <Skeleton variant="row" height={40} />
        </span>
        <span className="mt-2 block">
          <Skeleton variant="row" height={40} />
        </span>
      </SkeletonRegion>
      <SkeletonRegion label="Loading engine coverage" className="rounded-[10px] border border-[var(--border,#24242f)] p-4">
        <Skeleton variant="text" width="26%" height={12} />
        <span className="mt-4 block">
          <Skeleton variant="text" width="60%" />
        </span>
        <span className="mt-2 block">
          <Skeleton variant="text" width="48%" />
        </span>
      </SkeletonRegion>
    </div>
  );
}

export function BoardView({ cohortKey }: { cohortKey: string | null }) {
  const { runs, isLoading: runsLoading } = useAllRuns();
  const brands = useQuery(api.brands.listBrands);

  const finishedRuns = useMemo(
    () => runs.filter((run) => run.status === "complete" || run.status === "partial"),
    [runs],
  );
  const scope = useMemo(
    () =>
      runsLoading
        ? { cohortKey, current: null, previous: null }
        : scopeCohortRuns(finishedRuns, cohortKey),
    [runsLoading, finishedRuns, cohortKey],
  );

  const current = scope.current;
  const previous = scope.previous;

  const claims = useQuery(api.claims.byRun, current ? { runId: current._id } : "skip");
  const previousClaims = useQuery(
    api.claims.byRun,
    previous ? { runId: previous._id } : "skip",
  );
  const snapshots = useQuery(
    api.snapshots.byRun,
    current ? { runId: current._id } : "skip",
  );

  const brandNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const brand of brands ?? []) map[String(brand._id)] = brand.name;
    return map;
  }, [brands]);

  const brandIds = useMemo(
    () => (current ? current.brandIds.map((id) => String(id)) : []),
    [current],
  );
  const priorClaims = previous === null ? null : (previousClaims ?? null);

  const hookItems = useMemo(
    () => (claims !== undefined ? deriveHookDistribution(claims, priorClaims) : []),
    [claims, priorClaims],
  );
  const funnelItems = useMemo(
    () => (claims !== undefined ? deriveFunnelDistribution(claims, priorClaims) : []),
    [claims, priorClaims],
  );
  const leaders = useMemo(
    () => (claims !== undefined ? deriveLeaderboard(claims, brandIds, brandNames) : []),
    [claims, brandIds, brandNames],
  );
  const coverage = useMemo(
    () => (snapshots !== undefined ? deriveEngineCoverage(snapshots, brandIds, brandNames) : []),
    [snapshots, brandIds, brandNames],
  );
  const emerging = useMemo(
    () =>
      claims !== undefined && previousClaims !== undefined
        ? deriveEmerging(claims, previousClaims)
        : [],
    [claims, previousClaims],
  );

  const gaps = coverageGaps(coverage);
  const isPartial = current?.status === "partial" || gaps.length > 0;
  const singleBrand = brandIds.length === 1;
  const cohortTitle =
    brandIds.length > 0
      ? brandIds.map((id) => brandNames[id] ?? id.slice(0, 8)).join(" · ")
      : "No cohort selected";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 border-b border-border pb-5">
        <p className="type-caption uppercase tracking-[0.14em] text-fg-tertiary">Cross-brand evidence</p>
        <h1 className="type-display text-fg">
          Signal board
        </h1>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
          <span className="font-medium text-fg">{cohortTitle}</span>
          {current !== null ? (
            <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary,#64646f)]")}>
              run of {formatStamp(current.requestedAt)} · {current.status}
            </span>
          ) : null}
        </p>
        <p className="max-w-[68ch] type-body text-fg-secondary">
          {BOARD_HONESTY_LINE}
        </p>
      </header>

      {singleBrand ? (
        <p className="max-w-[68ch] type-caption text-fg-secondary">
          This cohort holds one rival. A pooled board compares two or more, so
          the mix below describes that rival alone.
        </p>
      ) : null}

      {isPartial ? (
        <p className="max-w-[68ch] type-caption text-fg-secondary">
          {current?.status === "partial" ? "This run is partial. " : ""}
          {gaps.length === 1
            ? "1 engine check did not return; it is named per rival below."
            : gaps.length > 1
              ? `${gaps.length} engine checks did not return; each is named per rival below.`
              : "Some engines did not return for this run."}{" "}
          A gap is never counted as a zero.
        </p>
      ) : null}

      {runsLoading ? (
        <BoardSkeleton />
      ) : current === null ? (
        <EmptyState
          icon={<BarChart3 {...iconProps} size={20} />}
          title="No runs yet for this cohort."
          description={EMPTY_DESCRIPTION}
          action={
            <Link href="/cohorts" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              Open cohorts
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <DistributionPanel
              items={hookItems}
              kind="hook"
              title="Top hooks across the cohort"
              loading={claims === undefined}
              summaryLabel={claims !== undefined ? `${claims.length} claims` : undefined}
              previousLabel={previous ? `vs run of ${formatStamp(previous.requestedAt)}` : undefined}
            />
            <DistributionPanel
              items={funnelItems}
              kind="funnel"
              title="Funnel distribution"
              loading={claims === undefined}
              summaryLabel={claims !== undefined ? `${claims.length} claims` : undefined}
              previousLabel={previous ? `vs run of ${formatStamp(previous.requestedAt)}` : undefined}
            />
          </div>
          <BrandLeaderboard
            rows={leaders}
            totalClaims={claims?.length ?? 0}
            loading={claims === undefined}
          />
          <EngineCoverage coverage={coverage} loading={snapshots === undefined} />
          <EmergingMoves
            moves={emerging}
            hasPrevious={previous !== null}
            loading={previous !== null && previousClaims === undefined}
            previousLabel={previous ? `vs run of ${formatStamp(previous.requestedAt)}` : undefined}
          />
        </>
      )}
    </div>
  );
}
