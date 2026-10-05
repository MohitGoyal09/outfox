"use client";

import { useQuery } from "convex/react";
import { ArrowDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  DistributionPanel,
  EmptyState,
  Panel,
  PillButton,
  SectionHeader,
  Skeleton,
  TrailSkeleton,
  buttonClasses,
  iconProps,
} from "@/components/drishti";
import {
  COST_PROVENANCE_LABEL,
  BrandMixPanel,
  ComparisonMatrix,
  EngineCoverage,
  ReRunButton,
  RunErrorBoundary,
  RunHeader,
  TrailSurface,
  WhatChanged,
  brandMixSummaries,
  brandNameMap,
  brandRefs,
  changeCopy,
  cohortLabel,
  composeBrief,
  costProvenance,
  deriveChange,
  engineGaps,
  engineRows,
  formatRunDayMonth,
  isTerminalRunStatus,
  mergeRuns,
  selectPreviousRun,
  sortRunsNewestFirst,
} from "@/components/drishti/runs";
import { cn } from "@/lib/utils";

const MIX_GRID =
  "grid grid-cols-1 gap-4 min-[900px]:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]";
const RUN_ID_RE = /^[a-z0-9]{32}$/;

function RunViewSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <RunHeader
        loading
        cohortName=""
        requestedAt={null}
        status="running"
        gaps={[]}
        requestCount={undefined}
        llmRequestCount={undefined}
        llmTokenCount={undefined}
        creditsUsed={undefined}
        creditsReported={undefined}
        exactCostUsd={undefined}
        estimatedCostUsd={undefined}
      />
      <WhatChanged loading />
      <div className="flex flex-col gap-4">
        <Skeleton variant="text" width={120} height={20} />
        <div className={MIX_GRID}>
          <DistributionPanel loading items={[]} kind="hook" title="Hook mix" />
          <DistributionPanel loading items={[]} kind="hook" title="Hook mix" />
        </div>
        <div className={MIX_GRID}>
          <DistributionPanel loading items={[]} kind="funnel" title="Funnel mix" />
          <DistributionPanel loading items={[]} kind="funnel" title="Funnel mix" />
        </div>
      </div>
      <ComparisonMatrix loading brands={[]} summaries={[]} previousLabel={null} />
      <EngineCoverage loading rows={[]} brands={[]} />
      <Panel interactive={false} className="p-5">
        <Skeleton variant="text" width={140} height={20} />
        <Skeleton className="mt-3" variant="text" lines={2} />
        <TrailSkeleton className="mt-4" density="vertical" />
      </Panel>
    </div>
  );
}

function BackLink({ href = "/", label = "Overview" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-[12.5px] text-fg-secondary hover:text-fg"
    >
      <ArrowLeft {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
      {label}
    </Link>
  );
}

function RunUnavailable({
  title,
  description,
  detail,
}: {
  title: string;
  description: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <BackLink />
      <Panel interactive={false} className="p-5">
        <EmptyState
          title={title}
          description={description}
          action={
            <Link href="/" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              Back to the Overview
            </Link>
          }
        />
        {detail === undefined ? null : (
          <p className="mt-2 break-all font-mono text-xs text-fg-tertiary">
            requested id: {detail}
          </p>
        )}
      </Panel>
    </div>
  );
}

function RunView({ runId }: { runId: string }) {
  const run = useQuery(
    api.runs.getRun,
    runId === "" ? "skip" : { runId: runId as Id<"runs"> },
  );
  const brands = useQuery(api.brands.listBrands);

  const complete = useQuery(api.runs.listByStatus, { status: "complete" });
  const partial = useQuery(api.runs.listByStatus, { status: "partial" });
  const failed = useQuery(api.runs.listByStatus, { status: "failed" });
  const running = useQuery(api.runs.listByStatus, { status: "running" });

  const runResolved = run !== null && run !== undefined;
  const claims = useQuery(
    api.claims.byRun,
    runResolved && run !== undefined ? { runId: run._id } : "skip",
  );
  const snapshots = useQuery(
    api.snapshots.byRun,
    runResolved && run !== undefined ? { runId: run._id } : "skip",
  );
  const brief = useQuery(
    api.briefs.latestForCohort,
    runResolved && run !== undefined ? { cohortKey: run.cohortKey } : "skip",
  );
  const usage = useQuery(
    api.llmUsage.usageForRun,
    runResolved && run !== undefined ? { runId: run._id } : "skip",
  );

  const runsLoaded =
    complete !== undefined &&
    partial !== undefined &&
    failed !== undefined &&
    running !== undefined;
  const allRuns = useMemo(
    () =>
      runsLoaded
        ? sortRunsNewestFirst(mergeRuns([complete, partial, failed, running]))
        : [],
    [runsLoaded, complete, partial, failed, running],
  );
  const previousRun = useMemo(
    () => (runResolved && runsLoaded && run !== undefined ? selectPreviousRun(allRuns, run) : null),
    [runResolved, runsLoaded, allRuns, run],
  );
  const previousClaims = useQuery(
    api.claims.byRun,
    previousRun !== null ? { runId: previousRun._id } : "skip",
  );

  const names = useMemo(() => brandNameMap(brands), [brands]);
  const refs = useMemo(
    () => (runResolved && run !== undefined ? brandRefs(run.brandIds, names) : []),
    [runResolved, run, names],
  );

  const currentClaims = claims;
  const previousResolved = previousRun === null || previousClaims !== undefined;
  const comparisonsLoading =
    currentClaims === undefined || !runsLoaded || !previousResolved;
  const previousForCompare =
    previousResolved && runsLoaded ? (previousRun === null ? null : (previousClaims ?? null)) : null;

  const rowData = useMemo(() => engineRows(snapshots, refs), [snapshots, refs]);
  const gaps = useMemo(() => engineGaps(rowData), [rowData]);
  const enginesReturned = useMemo(
    () => rowData.filter((row) => row.okCount > 0).length,
    [rowData],
  );

  const changeReady =
    runResolved && run !== undefined && currentClaims !== undefined && !comparisonsLoading;
  const change = useMemo(() => {
    if (!changeReady || run === null || run === undefined) return null;
    return deriveChange({
      brands: refs,
      currentClaims: currentClaims ?? [],
      previousClaims: previousForCompare,
      previousAt: previousRun === null ? null : previousRun.requestedAt,
      engineCount: enginesReturned,
    });
  }, [changeReady, run, refs, currentClaims, previousForCompare, previousRun, enginesReturned]);
  const copy = useMemo(() => (change === null ? null : changeCopy(change)), [change]);

  const summaries = useMemo(
    () =>
      brandMixSummaries({
        brands: refs,
        currentClaims: currentClaims ?? [],
        previousClaims: previousForCompare,
      }),
    [refs, currentClaims, previousForCompare],
  );

  const briefForRun =
    brief !== undefined &&
    brief !== null &&
    runResolved &&
    run !== undefined &&
    String(brief.runId) === String(run._id)
      ? brief
      : null;

  const composition = useMemo(
    () =>
      composeBrief({
        briefText: briefForRun?.briefText ?? null,
        mode: briefForRun?.mode ?? null,
        claims: currentClaims ?? [],
        gaps,
      }),
    [briefForRun, currentClaims, gaps],
  );

  const claimText = useMemo(() => {
    const map = new Map<string, string>();
    for (const claim of currentClaims ?? []) map.set(String(claim._id), claim.text);
    return map;
  }, [currentClaims]);

  const [focusedStepId, setFocusedStepId] = useState<string | null>(null);
  const [engineFilter, setEngineFilter] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [showAllSteps, setShowAllSteps] = useState(false);

  function focusClaim(claimId: string, brandId: string | null): void {
    setFocusedStepId(claimId);
    setShowAllSteps(true);
    setEngineFilter(null);
    setBrandFilter(brandId);
  }

  const evidenceClaim = useMemo(() => {
    if (change === null || change.kind !== "change" || currentClaims === undefined) {
      return null;
    }
    return (
      currentClaims.find(
        (claim) =>
          String(claim.brandId) === change.brandId && claim.hookType === change.hook,
      ) ?? null
    );
  }, [change, currentClaims]);

  if (runId === "") {
    return (
      <RunUnavailable
        title="No run was requested."
        description="This address has no run id in it, so there is nothing to open."
      />
    );
  }

  if (run === undefined || brands === undefined) {
    return <RunViewSkeleton />;
  }

  if (run === null) {
    return (
      <RunUnavailable
        detail={runId}
        title="This run does not exist."
        description="The id in the URL does not match a stored run. It may have been removed, or the link may be wrong."
      />
    );
  }

  const soleBrand = refs.length === 1 && names.has(refs[0].id) ? refs[0] : null;
  const backHref = soleBrand === null ? "/" : `/brands/${soleBrand.id}`;
  const backLabel = soleBrand === null ? "Overview" : soleBrand.name;
  const provenance = costProvenance(usage?.exactCostUsd, usage?.estimatedCostUsd);
  const previousDayMonth =
    previousRun === null ? null : formatRunDayMonth(previousRun.requestedAt);
  const mixPreviousLabel =
    previousDayMonth === null ? "no earlier run" : `vs run of ${previousDayMonth}`;
  const rerunBlocked =
    run.brandIds.length === 0
      ? "This run stored no rivals, so there is nothing to re-run."
      : run.status === "running"
        ? "This run is still in flight. Wait for it to finish first."
        : null;
  const actionClaimId =
    change !== null && change.kind === "change"
      ? evidenceClaim === null
        ? null
        : String(evidenceClaim._id)
      : currentClaims !== undefined && currentClaims.length > 0
        ? String(currentClaims[0]._id)
        : null;
  const actionBrandId =
    change !== null && change.kind === "change" ? change.brandId : null;

  return (
    <div className="flex flex-col gap-5">
      <BackLink href={backHref} label={backLabel} />

      <RunHeader
        cohortName={cohortLabel(run.brandIds, names)}
        requestedAt={run.requestedAt}
        status={isTerminalRunStatus(run.status) ? run.status : "running"}
        errorMessage={run.errorMessage ?? null}
        gaps={gaps}
        requestCount={run.requestCount}
        llmRequestCount={run.llmRequestCount}
        llmTokenCount={run.llmTokenCount}
        creditsUsed={run.creditCount}
        creditsReported={run.creditsReported}
        exactCostUsd={usage?.exactCostUsd}
        estimatedCostUsd={usage?.estimatedCostUsd}
        action={
          <ReRunButton
            brandIds={run.brandIds}
            estimate={{
              searches: run.requestCount,
              costUsd: usage?.costUsd ?? null,
              costLabel: COST_PROVENANCE_LABEL[provenance],
            }}
            disabledReason={rerunBlocked}
          />
        }
      />

      <WhatChanged
        copy={copy ?? undefined}
        loading={!changeReady}
        action={
          !changeReady ? null : (
            <PillButton
              variant="outline"
              size="sm"
              disabled={actionClaimId === null}
              onClick={() => {
                if (actionClaimId !== null) focusClaim(actionClaimId, actionBrandId);
              }}
            >
              {change !== null && change.kind === "change"
                ? "Show these claims in the trail"
                : "Show the claims in the trail"}
              <ArrowDown {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            </PillButton>
          )
        }
      />

      <section aria-label="Side by side" className="flex flex-col gap-4">
        <SectionHeader
          title="Side by side"
          sub={
            previousDayMonth === null
              ? "Each rival's mix, as this run recorded it. This is the first recorded comparison for the cohort, so there is no earlier mix to measure against."
              : `Each rival's mix, with the change against the run of ${previousDayMonth}.`
          }
        />

        {refs.length === 0 ? (
          <Panel interactive={false} className="p-4">
            <EmptyState
              size="sm"
              bounded
              title="This run has no rivals stored."
              description="A comparison needs at least one rival. This run's brand list is empty, so there is nothing to place side by side."
            />
          </Panel>
        ) : (
          <>
            <div>
              <SectionHeader as="h3" title="Hook mix" />
              <div className={cn("mt-3", MIX_GRID)}>
                {refs.map((brand) => (
                  <BrandMixPanel
                    key={brand.id}
                    brand={brand}
                    kind="hook"
                    runId={run._id}
                    previousRunId={previousRun === null ? null : previousRun._id}
                    previousLabel={mixPreviousLabel}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionHeader as="h3" title="Funnel mix" />
              <div className={cn("mt-3", MIX_GRID)}>
                {refs.map((brand) => (
                  <BrandMixPanel
                    key={brand.id}
                    brand={brand}
                    kind="funnel"
                    runId={run._id}
                    previousRunId={previousRun === null ? null : previousRun._id}
                    previousLabel={mixPreviousLabel}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <ComparisonMatrix
          brands={refs}
          summaries={summaries}
          previousLabel={previousDayMonth}
          loading={comparisonsLoading}
        />

        <EngineCoverage rows={rowData} brands={refs} loading={snapshots === undefined} />
      </section>

      <TrailSurface
        composition={composition}
        claimText={claimText}
        briefLoading={brief === undefined || currentClaims === undefined}
        claims={currentClaims ?? []}
        brands={refs}
        gaps={gaps}
        loading={currentClaims === undefined}
        focusedStepId={focusedStepId}
        onCite={(ids) => {
          const first = ids.find((id) => claimText.has(id));
          if (first !== undefined) focusClaim(first, null);
        }}
        onStepFocus={(id) => setFocusedStepId(id)}
        engineFilter={engineFilter}
        brandFilter={brandFilter}
        onEngineFilter={setEngineFilter}
        onBrandFilter={setBrandFilter}
        showAll={showAllSteps}
        onShowAll={setShowAllSteps}
      />
    </div>
  );
}

export default function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId: rawRunId } = use(params);
  const runId = decodeURIComponent(rawRunId ?? "");

  if (!RUN_ID_RE.test(runId)) {
    return (
      <RunUnavailable
        detail={runId}
        title="This run address is not valid."
        description="Open Run history and select a stored run instead of editing the address directly."
      />
    );
  }

  return (
    <RunErrorBoundary subject="this run">
      <RunView key={runId} runId={runId} />
    </RunErrorBoundary>
  );
}
