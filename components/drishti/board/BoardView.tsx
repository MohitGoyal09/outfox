"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DistributionPanel } from "../DistributionPanel";
import { EmptyState } from "../EmptyState";
import { stageName } from "../labels";
import { Panel } from "../Panel";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { StatTile } from "../StatReadout";
import { PageHeader } from "../PageHeader";
import { Notice } from "../Notice";
import { pillClasses } from "../PillButton";
import { VALUE_CLASS, iconProps } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";
import { useAllRuns } from "../cohorts/useAllRuns";
import { BrandHookMatrix } from "./BrandHookMatrix";
import { BrandLeaderboard } from "./BrandLeaderboard";
import { EngineCoverage } from "./EngineCoverage";
import { BoardMixChart } from "./BoardMixChart";
import { REMOVED_BRAND_LABEL } from "../runs/derive";
import { OffTopicNotice } from "../brands/filters/OffTopicNotice";
import { dropOffTopic } from "../brands/topicality";
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
  deriveBrandHookMatrix,
  deriveHookOverIndex,
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

type ClaimSet = NonNullable<ReturnType<typeof useQuery<typeof api.claims.byRun>>>;

function offTopicFiltered(
  list: ClaimSet | undefined,
  brandsById: ReadonlyMap<string, { name: string; domain: string; aliases?: string[]; vertical: string }> | null,
  show: boolean,
): { kept: ClaimSet; hidden: number } | undefined {
  if (list === undefined || brandsById === null) return undefined;
  const { kept, hiddenFindings } = dropOffTopic(list, brandsById);
  return { kept: show ? list : kept, hidden: hiddenFindings };
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

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const showOffTopic = searchParams.get("offtopic") === "show";
  const toggleOffTopic = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (showOffTopic) params.delete("offtopic");
    else params.set("offtopic", "show");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const brandsById = useMemo(
    () => (brands === undefined ? null : new Map(brands.map((brand) => [String(brand._id), brand]))),
    [brands],
  );
  const rawScopeCurrent = scope?.currentClaims;
  const rawScopePrevious = scope?.previousClaims;
  const currentSet = useMemo(
    () => offTopicFiltered(cohortKey === null ? rawScopeCurrent : pinnedClaims, brandsById, showOffTopic),
    [cohortKey, rawScopeCurrent, pinnedClaims, brandsById, showOffTopic],
  );
  const previousSet = useMemo(
    () => offTopicFiltered(cohortKey === null ? rawScopePrevious : pinnedPrevious, brandsById, showOffTopic),
    [cohortKey, rawScopePrevious, pinnedPrevious, brandsById, showOffTopic],
  );
  const claims = currentSet?.kept;
  const hiddenOffTopic = currentSet?.hidden ?? 0;
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
  const scopeCurrent = cohortKey === null ? claims : undefined;
  const scopePrevious = cohortKey === null ? previousSet?.kept : undefined;
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
    () => (cohortKey === null ? emergingScope.currentClaims : (claims ?? [])),
    [cohortKey, emergingScope, claims],
  );
  const emergingPrevious = useMemo(
    () =>
      cohortKey === null
        ? comparedBrands > 0
          ? emergingScope.previousClaims
          : null
        : (previousSet?.kept ?? null),
    [cohortKey, comparedBrands, emergingScope, previousSet],
  );
  const hasPrevious = cohortKey === null ? comparedBrands > 0 : pinned.previous !== null;

  const priorClaims = cohortKey === null ? (previousSet?.kept ?? null) : (pinned.previous === null ? null : (previousSet?.kept ?? null));

  const hookItems = useMemo(
    () => (claims !== undefined ? deriveHookDistribution(claims, priorClaims) : []),
    [claims, priorClaims],
  );
  const funnelItems = useMemo(
    () => (claims !== undefined ? deriveFunnelDistribution(claims, priorClaims) : []),
    [claims, priorClaims],
  );
  const hookMatrix = useMemo(
    () => (claims !== undefined ? deriveBrandHookMatrix(claims, brandIds, brandNames, ownBrandId) : null),
    [claims, brandIds, brandNames, ownBrandId],
  );
  const hookCallouts = useMemo(() => (hookMatrix !== null ? deriveHookOverIndex(hookMatrix) : []), [hookMatrix]);
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
  const checkedAtDiffers = new Set(cohortBrands.map((brand) => formatStamp(brand.checkedAt))).size > 1;
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
  const offTopicVisible = hiddenOffTopic > 0;
  const hasCaveats =
    offTopicVisible || ownBrandNotInView || coverageLine !== null || isPartial;
  const caveatTitle = isPartial
    ? "Some sources could not be checked. A gap is never counted as a zero."
    : "A few notes on what this read covers.";
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
      <PageHeader
        eyebrow="Signals"
        title="What the evidence says, pooled"
        sub={BOARD_HONESTY_LINE}
        meta={
          checkedLine !== null ? (
            <>
              <span className={cn(VALUE_CLASS, "text-xs font-normal text-fg-secondary")}>{checkedLine}</span>
              {cohortBrands.length > 0 ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className={pillClasses("outline", "sm")}>
                      Per brand
                      <ChevronDown {...iconProps} size={12} aria-hidden="true" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80">
                    <p className="mb-1.5 text-xs text-fg-secondary">
                      Each brand is read at its own latest check.
                    </p>
                    <ul aria-label="Brands in view" className="flex flex-col gap-1">
                      {cohortBrands.map((brand) => (
                        <li key={brand.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                          <span className="font-medium text-fg">
                            {brand.name}
                            {brand.isOwn ? (
                              <span className="ml-1.5 rounded-sm bg-bg-inset px-1 py-px text-xs font-normal text-fg-secondary">
                                You
                              </span>
                            ) : null}
                          </span>
                          {checkedAtDiffers ? (
                            <span className={cn(VALUE_CLASS, "text-xs font-normal text-fg-tertiary")}>
                              {formatStamp(brand.checkedAt)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              ) : null}
            </>
          ) : (
            <span className="text-[13px] font-medium text-fg-secondary">No brands tracked yet</span>
          )
        }
      />

      {hasCaveats ? (
        <Notice
          tone={isPartial ? "warn" : "info"}
          title={caveatTitle}
        >
          {offTopicVisible ? (
            <OffTopicNotice
              hiddenCount={hiddenOffTopic}
              subject="the brand they were found for"
              showing={showOffTopic}
              onToggle={toggleOffTopic}
            />
          ) : null}
          {ownBrandNotInView ? (
            <p>
              {ownBrand?.name} is your brand but has no finished check yet, so there is nothing to compare.
            </p>
          ) : null}
          {coverageLine !== null ? <p>{coverageLine}</p> : null}
          {isPartial && gaps.length > 0 ? (
            <p>{`${gaps.length} ${gaps.length === 1 ? "source" : "sources"} could not be checked, named per rival below.`}</p>
          ) : null}
        </Notice>
      ) : null}

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
              <StatTile
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
          title="No finished checks yet."
          description={EMPTY_DESCRIPTION}
          action={
            <Link href="/brands" className={pillClasses("ink", "sm")}>
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
          {brandIds.length >= 2 ? (
            <BrandHookMatrix
              matrix={hookMatrix ?? { hooks: [], rows: [] }}
              callouts={hookCallouts}
              loading={claims === undefined}
            />
          ) : null}
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
