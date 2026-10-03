"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { BarChart3, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { EngineCoverage } from "./EngineCoverage";
import { BoardMixChart } from "./BoardMixChart";
import { REMOVED_BRAND_LABEL } from "../runs/derive";
import {
  BOARD_HONESTY_LINE,
  countFindings,
  countUnclear,
  coverageGaps,
  deriveEmerging,
  formatDay,
  formatDayRange,
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

  const claims = cohortKey === null ? scope?.currentClaims : pinnedClaims;
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

  const scopeBrands = scope?.brands;
  const scopeCurrent = scope?.currentClaims;
  const scopePrevious = scope?.previousClaims;
  const emergingScope = useMemo(
    () =>
      scopeEmergingToComparable(
        (scopeBrands ?? []).map((b) => ({ brandId: String(b.brandId), hasPrevious: b.hasPrevious })),
        scopeCurrent ?? [],
        scopePrevious ?? [],
      ),
    [scopeBrands, scopeCurrent, scopePrevious],
  );
  const comparedBrands = emergingScope.comparedBrands;
  const emergingCurrent = useMemo(
    () => (cohortKey === null ? emergingScope.currentClaims : (pinnedClaims ?? [])),
    [cohortKey, emergingScope, pinnedClaims],
  );
  const emergingPrevious = useMemo(
    () =>
      cohortKey === null
        ? comparedBrands > 0
          ? emergingScope.previousClaims
          : null
        : (pinnedPrevious ?? null),
    [cohortKey, comparedBrands, emergingScope, pinnedPrevious],
  );
  const hasPrevious = cohortKey === null ? comparedBrands > 0 : pinned.previous !== null;

  const priorClaims = cohortKey === null ? (scope?.previousClaims ?? null) : (pinned.previous === null ? null : (pinnedPrevious ?? null));

  const hookItems = useMemo(
    () => (claims !== undefined ? deriveHookDistribution(claims, priorClaims) : []),
    [claims, priorClaims],
  );
  const funnelItems = useMemo(
    () => (claims !== undefined ? deriveFunnelDistribution(claims, priorClaims) : []),
    [claims, priorClaims],
  );
  const funnelUnclear = claims !== undefined ? countUnclear(claims, "funnelStage") : 0;
  const funnelClear = funnelItems.reduce((sum, item) => sum + (item.count ?? 0), 0);
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
    cohortKey === null && comparedBrands > 0
      ? `${comparedBrands} of ${scope?.brands.length ?? 0} brands with two checks`
      : null;
  const comparedBrandsNote =
    cohortKey === null && comparedBrands > 0
      ? `${comparedBrands} of ${scope?.brands.length ?? 0} ${
          comparedBrands === 1 ? "brand has" : "brands have"
        } two checks`
      : null;
  const comparisonColumnLabel =
    cohortKey === null
      ? comparedBrandsNote
        ? "Change since previous check"
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
    checkedAt: cohortKey === null ? (checkedAtByBrand.get(id) ?? null) : (pinnedRun?.requestedAt ?? null),
  }));
  const stamps = (scope?.brands ?? []).map((brand) => brand.checkedAt).sort();
  const oldestStamp = stamps[0] ?? null;
  const newestStamp = stamps[stamps.length - 1] ?? null;
  const checkedLine = pinnedRun
    ? `Checked ${formatDay(pinnedRun.requestedAt)} · ${pinnedRun.status}`
    : oldestStamp !== null && newestStamp !== null
      ? `Checked ${formatDayRange(oldestStamp, newestStamp)}`
      : null;
  const ownBrandInView = ownBrandId !== null && brandIds.includes(ownBrandId);
  const ownBrandNotInView = ownBrand != null && ownBrandId !== null && !ownBrandInView;
  const rivalCountInView = brandIds.length - (ownBrandInView ? 1 : 0);
  const summaryStats: {
    label: string;
    value: string | number;
    hint: string;
    labelInfo?: string;
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
      label: "In the latest checks",
      labelInfo:
        cohortKey === null
          ? "Findings from each brand's most recent finished check only. Home counts every stored finding across all checks, so its number is larger."
          : "Findings from the one check this page is pinned to. Home counts every stored finding across all checks.",
      value: claims !== undefined ? countFindings(claims) : 0,
      hint: cohortKey === null ? "each brand's latest check" : "this check only",
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
      <header className="flex flex-col gap-1.5 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h1 className="type-display text-fg">Signals</h1>
          {checkedLine !== null ? (
            <div className="flex items-center gap-2 text-[13px] text-fg-secondary">
              <span className={cn(VALUE_CLASS, "font-normal")}>{checkedLine}</span>
              {cohortBrands.length > 0 ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-raised px-2 py-1 text-[12px] font-medium text-fg hover:bg-bg-raised-2"
                    >
                      Per brand
                      <ChevronDown {...iconProps} size={12} aria-hidden="true" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <p className="mb-1.5 text-[12px] text-fg-secondary">
                      Each brand is read at its own latest check.
                    </p>
                    <ul aria-label="Brands in view" className="flex flex-col gap-1">
                      {cohortBrands.map((brand) => (
                        <li key={brand.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                          <span className="font-medium text-fg">
                            {brand.name}
                            {brand.isOwn ? (
                              <span className="ml-1.5 rounded-sm bg-[var(--bg-inset)] px-1 py-px text-[10.5px] font-normal text-fg-secondary">
                                You
                              </span>
                            ) : null}
                          </span>
                          <span className={cn(VALUE_CLASS, "text-[11px] font-normal text-[var(--text-tertiary)]")}>
                            {formatStamp(brand.checkedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          ) : (
            <span className="text-[13px] font-medium text-fg-secondary">No brands tracked yet</span>
          )}
        </div>
        <p className="max-w-[68ch] type-body text-fg-secondary">{BOARD_HONESTY_LINE}</p>
        {ownBrandNotInView ? (
          <p className="max-w-[68ch] type-caption text-fg-secondary">
            {ownBrand?.name} is your brand but has no finished check yet, so there is nothing to compare.
          </p>
        ) : null}
        {coverageLine !== null ? (
          <p className="max-w-[68ch] type-caption text-fg-secondary">{coverageLine}</p>
        ) : null}
        {isPartial ? (
          <p className="max-w-[68ch] type-caption text-fg-secondary">
            {anyPartial ? "Partial check. " : ""}
            {gaps.length > 0
              ? `${gaps.length} ${gaps.length === 1 ? "source" : "sources"} could not be checked, named per rival below. `
              : "Some sources could not be checked. "}
            A gap is never counted as a zero.
          </p>
        ) : null}
      </header>

      {singleBrand ? (
        <p className="max-w-[68ch] type-caption text-fg-secondary">
          {cohortKey === null
            ? "You track one brand. A pooled read compares two or more, so the mix below describes that brand alone."
            : "This check covers one brand. A pooled read compares two or more, so the mix below describes that brand alone."}
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
                labelInfo={stat.labelInfo}
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
              unclearCount={claims !== undefined ? countUnclear(claims, "hookType") : 0}
              loading={claims === undefined}
              moves={hasPrevious ? emerging : []}
              changeNote={comparedBrandsNote ?? undefined}
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
              previousInfo="Change in share, in percentage points (pp), since the previous check."
              totalLabel="with a clear stage"
              footnote={
                claims !== undefined && funnelUnclear > 0
                  ? `${funnelUnclear} ${funnelUnclear === 1 ? "finding had" : "findings had"} no clear stage and ${funnelUnclear === 1 ? "is" : "are"} left out of this table and its shares. Shares are of the ${funnelClear} tagged ${funnelClear === 1 ? "finding" : "findings"} with a clear stage.`
                  : undefined
              }
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
        </>
      )}
    </div>
  );
}
