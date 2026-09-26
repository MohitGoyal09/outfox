"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "../Button";
import { DistributionPanel } from "../DistributionPanel";
import { EmptyState } from "../EmptyState";
import { stageName } from "../labels";
import { Panel } from "../Panel";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { StatReadout } from "../StatReadout";
import { VALUE_CLASS, iconProps } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";
import { useAllRuns } from "../cohorts/useAllRuns";
import { BrandLeaderboard } from "./BrandLeaderboard";
import { EmergingMoves } from "./EmergingMoves";
import { EngineCoverage } from "./EngineCoverage";
import { BoardMixChart } from "./BoardMixChart";
import {
  BOARD_HONESTY_LINE,
  coverageGaps,
  deriveEmerging,
  deriveEngineCoverage,
  deriveFunnelDistribution,
  deriveHookDistribution,
  deriveLeaderboard,
  deriveOwnBrandHookComparison,
  runCoverageLine,
  scopeCohortRuns,
} from "./board-model";

const EMPTY_DESCRIPTION =
  "A check reads every brand it covers at one moment. Signals pools those brands together, so it appears once at least one check has finished.";

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionPanel items={[]} kind="hook" title="Hook mix" loading />
        <DistributionPanel items={[]} kind="funnel" title="Funnel distribution" loading />
      </div>
      <SkeletonRegion label="Loading brand leaderboard" className="rounded-lg border border-border bg-bg-raised p-4 shadow-xs">
        <Skeleton variant="text" width="30%" height={12} />
        <span className="mt-4 block">
          <Skeleton variant="row" height={40} />
        </span>
        <span className="mt-2 block">
          <Skeleton variant="row" height={40} />
        </span>
      </SkeletonRegion>
      <SkeletonRegion label="Loading what we checked" className="rounded-lg border border-border bg-bg-raised p-4 shadow-xs">
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
  const ownBrand = useQuery(api.brands.getOwnBrand);
  const ownBrandId = ownBrand ? String(ownBrand._id) : null;

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
    () => (claims !== undefined ? deriveLeaderboard(claims, brandIds, brandNames, ownBrandId) : []),
    [claims, brandIds, brandNames, ownBrandId],
  );
  const coverage = useMemo(
    () =>
      snapshots !== undefined
        ? deriveEngineCoverage(snapshots, brandIds, brandNames, ownBrandId)
        : [],
    [snapshots, brandIds, brandNames, ownBrandId],
  );
  const hookComparison = useMemo(
    () => (claims !== undefined ? deriveOwnBrandHookComparison(claims, brandIds, ownBrandId) : null),
    [claims, brandIds, ownBrandId],
  );
  const emerging = useMemo(
    () =>
      claims !== undefined && previousClaims !== undefined
        ? deriveEmerging(claims, previousClaims)
        : [],
    [claims, previousClaims],
  );

  const coverageLine = brands !== undefined ? runCoverageLine(brands, finishedRuns, runs) : null;

  const gaps = coverageGaps(coverage);
  const isPartial = current?.status === "partial" || gaps.length > 0;
  const singleBrand = brandIds.length === 1;
  const totalChecks = coverage.reduce((total, brand) => total + brand.cells.length, 0);
  const okChecks = coverage.reduce(
    (total, brand) =>
      total + brand.cells.filter((cell) => cell.status === "ok").length,
    0,
  );
  const cohortBrands = brandIds.map((id) => ({
    id,
    name: brandNames[id] ?? id.slice(0, 8),
    isOwn: id === ownBrandId,
  }));
  const ownBrandInView = ownBrandId !== null && brandIds.includes(ownBrandId);
  const ownBrandNotInView = ownBrand != null && ownBrandId !== null && !ownBrandInView;
  const rivalCountInView = brandIds.length - (ownBrandInView ? 1 : 0);
  const summaryStats: { label: string; value: string | number; hint: string }[] = [
    {
      label: "Brands in view",
      value: brandIds.length,
      hint: ownBrandInView
        ? `You plus ${rivalCountInView} ${rivalCountInView === 1 ? "rival" : "rivals"}`
        : "Rivals in this check",
    },
    {
      label: "Findings held",
      value: claims?.length ?? 0,
      hint: "What we found, not performance",
    },
    {
      label: "What we checked",
      value: `${okChecks}/${totalChecks}`,
      hint: "Checks that returned data",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="type-display text-fg">Signals</h1>
          {current ? <Badge variant="outline" className={cn(VALUE_CLASS, "font-normal")}>{current.status} · {formatStamp(current.requestedAt)}</Badge> : null}
        </div>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] leading-[1.5] text-fg-secondary">
          <span className="font-medium text-fg">
            {cohortBrands.length > 0
              ? cohortBrands.map((brand, index) => (
                  <span key={brand.id}>
                    {index > 0 ? " · " : ""}
                    {brand.isOwn ? <>You — {brand.name}</> : brand.name}
                  </span>
                ))
              : "No brands in this check"}
          </span>
          {current !== null ? (
            <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary)]")}>
              checked {formatStamp(current.requestedAt)} · {current.status}
            </span>
          ) : null}
        </p>
        <p className="max-w-[68ch] type-body text-fg-secondary">
          {BOARD_HONESTY_LINE}
        </p>
        {ownBrandNotInView ? (
          <p className="max-w-[68ch] type-caption text-fg-secondary">
            {ownBrand?.name} is set as your brand, but it has not appeared in a finished
            check yet — nothing to compare it against until it has.
          </p>
        ) : null}
        {coverageLine !== null ? (
          <p className="max-w-[68ch] type-caption text-fg-secondary">{coverageLine}</p>
        ) : null}
      </header>

      {singleBrand ? (
        <p className="max-w-[68ch] type-caption text-fg-secondary">
          This check covers one brand. A pooled read compares two or more, so
          the mix below describes that brand alone.
        </p>
      ) : null}

      {isPartial ? (
        <p className="max-w-[68ch] type-caption text-fg-secondary">
          {current?.status === "partial" ? "This check is partial. " : ""}
          {gaps.length === 1
            ? "1 source could not be checked; it is named per rival below."
            : gaps.length > 1
              ? `${gaps.length} sources could not be checked; each is named per rival below.`
              : "Some sources could not be checked for this check."}{" "}
          A gap is never counted as a zero.
        </p>
      ) : null}

      {current && claims !== undefined ? (
        <div className="grid gap-3 sm:grid-cols-3" aria-label="Board summary">
          {summaryStats.map((stat) => (
            <Panel key={stat.label} interactive={false} padded>
              <StatReadout
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                size="md"
              />
            </Panel>
          ))}
        </div>
      ) : null}

      {runsLoading ? (
        <BoardSkeleton />
      ) : current === null ? (
        <EmptyState
          icon={<BarChart3 {...iconProps} size={20} />}
          title="No finished checks yet."
          description={EMPTY_DESCRIPTION}
          action={
            <Link href="/brands" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              Browse brands
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <BoardMixChart items={hookItems} />
            <DistributionPanel
              items={funnelItems}
              kind="funnel"
              title="Funnel distribution"
              formatLabel={(label) => stageName(label)}
              loading={claims === undefined}
              summaryLabel={claims !== undefined ? `${claims.length} findings` : undefined}
              previousLabel={previous ? `vs ${formatStamp(previous.requestedAt)}` : undefined}
              emptyTitle="No funnel mix in this check yet."
              emptyDescription="Every finding carries a funnel stage. The mix appears here once at least one source returns findings."
            />
          </div>
          <BrandLeaderboard
            rows={leaders}
            totalClaims={claims?.length ?? 0}
            comparison={hookComparison}
            loading={claims === undefined}
          />
          <EngineCoverage coverage={coverage} loading={snapshots === undefined} />
          <EmergingMoves
            moves={emerging}
            hasPrevious={previous !== null}
            loading={previous !== null && previousClaims === undefined}
            previousLabel={previous ? `vs ${formatStamp(previous.requestedAt)}` : undefined}
          />
        </>
      )}
    </div>
  );
}
