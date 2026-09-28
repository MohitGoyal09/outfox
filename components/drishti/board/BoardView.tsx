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
import { REMOVED_BRAND_LABEL } from "../runs/derive";
import {
  BOARD_HONESTY_LINE,
  countFindings,
  coverageGaps,
  deriveEmerging,
  deriveEngineCoverage,
  deriveFunnelDistribution,
  deriveHookDistribution,
  deriveLeaderboard,
  deriveOwnBrandHookComparison,
  runCoverageLine,
  scopeCohortRuns,
  scopeEmergingToComparable,
  taggedShareLabel,
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

  const pinned = useMemo(
    () =>
      cohortKey === null || runsLoading
        ? { cohortKey, current: null, previous: null }
        : scopeCohortRuns(finishedRuns, cohortKey),
    [runsLoading, finishedRuns, cohortKey],
  );
  const pinnedRun = pinned.current;

  const scope = useQuery(api.claims.signalsScope, cohortKey === null ? {} : "skip");

  const pinnedClaims = useQuery(api.claims.byRun, pinnedRun ? { runId: pinnedRun._id } : "skip");
  const pinnedPrevious = useQuery(
    api.claims.byRun,
    pinned.previous ? { runId: pinned.previous._id } : "skip",
  );
  const pinnedSnapshots = useQuery(
    api.snapshots.byRun,
    pinnedRun ? { runId: pinnedRun._id } : "skip",
  );

  const claims = cohortKey === null ? scope?.current : pinnedClaims;
  const snapshots = cohortKey === null ? scope?.snapshots : pinnedSnapshots;

  const brandNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const brand of brands ?? []) map[String(brand._id)] = brand.name;
    return map;
  }, [brands]);

  const brandIds = useMemo(
    () =>
      cohortKey === null
        ? (scope?.brands ?? []).map((brand) => String(brand.brandId))
        : pinnedRun
          ? pinnedRun.brandIds.map((id) => String(id))
          : [],
    [cohortKey, scope, pinnedRun],
  );

  const emergingScope = useMemo(
    () =>
      scopeEmergingToComparable(
        (scope?.brands ?? []).map((b) => ({ brandId: String(b.brandId), hasPrevious: b.hasPrevious })),
        scope?.current ?? [],
        scope?.previous ?? [],
      ),
    [scope],
  );
  const comparable = { size: emergingScope.comparedBrands };
  const emergingCurrent = cohortKey === null ? emergingScope.current : (pinnedClaims ?? []);
  const emergingPrevious =
    cohortKey === null
      ? emergingScope.comparedBrands > 0
        ? emergingScope.previous
        : null
      : (pinnedPrevious ?? null);
  const hasPrevious = cohortKey === null ? emergingScope.comparedBrands > 0 : pinned.previous !== null;

  const priorClaims = cohortKey === null ? (scope?.previous ?? null) : (pinned.previous === null ? null : (pinnedPrevious ?? null));

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
    () => (emergingPrevious !== null ? deriveEmerging(emergingCurrent, emergingPrevious) : []),
    [emergingCurrent, emergingPrevious],
  );

  const coverageLine = brands !== undefined ? runCoverageLine(brands, finishedRuns, runs) : null;

  const comparedBrandsCount =
    cohortKey === null && comparable.size > 0
      ? `${comparable.size} of ${scope?.brands.length ?? 0} brands with two checks`
      : null;
  const comparedBrandsNote =
    cohortKey === null && comparable.size > 0
      ? `${comparable.size} of ${scope?.brands.length ?? 0} ${
          comparable.size === 1 ? "brand has" : "brands have"
        } two checks`
      : null;
  const comparisonLabel =
    cohortKey === null
      ? comparedBrandsNote
        ? `vs each brand's previous check · ${comparedBrandsNote}`
        : undefined
      : pinned.previous
        ? `vs ${formatStamp(pinned.previous.requestedAt)}`
        : undefined;
  const comparisonColumnLabel =
    cohortKey === null
      ? comparedBrandsNote
        ? "vs previous check"
        : undefined
      : pinned.previous
        ? `vs ${formatStamp(pinned.previous.requestedAt)}`
        : undefined;
  const hasAnyCheck = cohortKey === null ? (scope?.brands.length ?? 0) > 0 : pinnedRun !== null;
  const gaps = coverageGaps(coverage);
  const anyPartial =
    cohortKey === null
      ? (scope?.brands ?? []).some((brand) => brand.status === "partial")
      : pinnedRun?.status === "partial";
  const isPartial = anyPartial || gaps.length > 0;
  const singleBrand = brandIds.length === 1;
  const totalChecks = coverage.reduce((total, brand) => total + brand.cells.length, 0);
  const okChecks = coverage.reduce(
    (total, brand) =>
      total + brand.cells.filter((cell) => cell.status === "ok").length,
    0,
  );
  const checkedAtByBrand = new Map(
    (scope?.brands ?? []).map((brand) => [String(brand.brandId), brand.checkedAt]),
  );
  const cohortBrands = brandIds.map((id) => ({
    id,
    name: brandNames[id] ?? REMOVED_BRAND_LABEL,
    isOwn: id === ownBrandId,
    checkedAt: cohortKey === null ? (checkedAtByBrand.get(id) ?? null) : null,
  }));
  const stamps = (scope?.brands ?? []).map((brand) => brand.checkedAt).sort();
  const oldestStamp = stamps[0] ?? null;
  const newestStamp = stamps[stamps.length - 1] ?? null;
  const spansOneMoment = oldestStamp !== null && oldestStamp === newestStamp;
  const ownBrandInView = ownBrandId !== null && brandIds.includes(ownBrandId);
  const ownBrandNotInView = ownBrand != null && ownBrandId !== null && !ownBrandInView;
  const rivalCountInView = brandIds.length - (ownBrandInView ? 1 : 0);
  const summaryStats: {
    label: string;
    value: string | number;
    hint: string;
    loading?: boolean;
  }[] = [
    {
      label: "Brands in view",
      value: brandIds.length,
      hint: ownBrandInView
        ? `you plus ${rivalCountInView} ${rivalCountInView === 1 ? "rival" : "rivals"}`
        : cohortKey === null
          ? "no brand of yours is tracked"
          : "no brand of yours in this check",
    },
    {
      label: "Findings held",
      value: claims !== undefined ? countFindings(claims) : 0,
      hint: `across ${brandIds.length} ${brandIds.length === 1 ? "brand" : "brands"}`,
    },
    {
      label: "What we checked",
      value: `${okChecks}/${totalChecks}`,
      hint: `of ${totalChecks} source ${totalChecks === 1 ? "check" : "checks"}`,
      loading: snapshots === undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="type-display text-fg">Signals</h1>
          {pinnedRun ? (
            <Badge variant="outline" className={cn(VALUE_CLASS, "font-normal")}>
              {pinnedRun.status} · {formatStamp(pinnedRun.requestedAt)}
            </Badge>
          ) : newestStamp !== null ? (
            <Badge variant="outline" className={cn(VALUE_CLASS, "font-normal")}>
              {spansOneMoment
                ? formatStamp(newestStamp)
                : `${formatStamp(oldestStamp as string)} — ${formatStamp(newestStamp)}`}
            </Badge>
          ) : null}
        </div>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] leading-[1.5] text-fg-secondary">
          <span className="font-medium text-fg">
            {cohortBrands.length > 0
              ? cohortBrands.map((brand, index) => (
                  <span key={brand.id}>
                    {index > 0 ? " · " : ""}
                    {brand.isOwn ? <>You — {brand.name}</> : brand.name}
                    {brand.checkedAt !== null ? (
                      <span className={cn(VALUE_CLASS, "ml-1 text-[11px] font-normal text-[var(--text-tertiary)]")}>
                        {formatStamp(brand.checkedAt)}
                      </span>
                    ) : null}
                  </span>
                ))
              : "No brands tracked yet"}
          </span>
          {pinnedRun !== null ? (
            <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary)]")}>
              checked {formatStamp(pinnedRun.requestedAt)} · {pinnedRun.status}
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
          {cohortKey === null
            ? "You track one brand. A pooled read compares two or more, so the mix below describes that brand alone."
            : "This check covers one brand. A pooled read compares two or more, so the mix below describes that brand alone."}
        </p>
      ) : null}

      {isPartial ? (
        <p className="max-w-[68ch] type-caption text-fg-secondary">
          {anyPartial ? (cohortKey === null ? "At least one brand's latest check is partial. " : "This check is partial. ") : ""}
          {gaps.length === 1
            ? "1 source could not be checked; it is named per rival below."
            : gaps.length > 1
              ? `${gaps.length} sources could not be checked; each is named per rival below.`
              : "Some sources could not be checked for this check."}{" "}
          A gap is never counted as a zero.
        </p>
      ) : null}

      {hasAnyCheck && claims !== undefined ? (
        <div className="grid gap-2.5 sm:grid-cols-3" aria-label="Board summary">
          {summaryStats.map((stat) => (
            <Panel key={stat.label} interactive={false} className="p-3.5">
              <StatReadout
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                size="md"
                loading={stat.loading}
              />
            </Panel>
          ))}
        </div>
      ) : null}

      {runsLoading ? (
        <BoardSkeleton />
      ) : !hasAnyCheck ? (
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
            <BoardMixChart
              items={hookItems}
              totalFindings={claims !== undefined ? countFindings(claims) : null}
              loading={claims === undefined}
            />
            <DistributionPanel
              items={funnelItems}
              kind="funnel"
              title="Funnel distribution"
              formatLabel={(label) => stageName(label)}
              loading={claims === undefined}
              summaryLabel={
                claims !== undefined
                  ? comparedBrandsNote
                    ? `${taggedShareLabel(claims)} · change covers ${comparedBrandsCount}`
                    : taggedShareLabel(claims)
                  : undefined
              }
              previousLabel={comparisonColumnLabel}
              emptyTitle="No funnel mix in this check yet."
              emptyDescription="Every tagged finding carries a funnel stage. The mix appears here once at least one finding has been tagged."
            />
          </div>
          <BrandLeaderboard
            rows={leaders}
            totalClaims={claims !== undefined ? countFindings(claims) : 0}
            comparison={hookComparison}
            loading={claims === undefined}
          />
          <EngineCoverage coverage={coverage} loading={snapshots === undefined} />
          <EmergingMoves
            moves={emerging}
            hasPrevious={hasPrevious}
            loading={cohortKey === null ? scope === undefined : pinned.previous !== null && pinnedPrevious === undefined}
            previousLabel={comparisonLabel}
          />
        </>
      )}
    </div>
  );
}
