"use client";


import { cn } from "@/lib/utils";
import { Trail, type TrailStep } from "../Trail";
import { Button } from "../Button";
import { Panel } from "../Panel";
import { Skeleton, SkeletonRows } from "../Skeleton";
import { StatReadout } from "../StatReadout";
import { LABEL_CLASS, VALUE_CLASS, barWidthPct } from "../tokens";
import {
  countClaimsByEngine,
  engineLabel,
  topSignals,
  totalClaims,
  type ClaimDoc,
  type RunDoc,
} from "./brand-model";
import { formatStamp } from "../cohorts/cohorts-model";

export type BrandOverviewProps = {
  claims: ClaimDoc[];
  latestRun: RunDoc | null;
  cohortLatest: RunDoc | null;
  exactCostUsd: number;
  estimatedCostUsd: number;
  llmRequestCount: number;
  llmTokenCount: number;
  runCount: number;
  onOpenSignals?: () => void;
  isLoading?: boolean;
  className?: string;
};

function toTrailStep(claim: ClaimDoc): TrailStep {
  const value = claim.value ?? null;
  return {
    id: String(claim._id),
    label: claim.metric ?? claim.sourceEngine,
    value,
    reasoning: claim.text,
    href: claim.evidenceUrl,
    meta: { at: formatStamp(claim.fetchedAt) },
  };
}

export function BrandOverview({
  claims,
  latestRun,
  cohortLatest,
  exactCostUsd,
  estimatedCostUsd,
  llmRequestCount,
  llmTokenCount,
  runCount,
  onOpenSignals,
  isLoading = false,
  className,
}: BrandOverviewProps) {
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="grid gap-4 sm:grid-cols-2 min-[1200px]:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="stat" height={40} width="100%" />
          ))}
        </div>
        <SkeletonRows count={3} variant="block" height={120} />
      </div>
    );
  }

  const engineCounts = countClaimsByEngine(claims);
  const maxCount = engineCounts.reduce(
    (max, row) => Math.max(max, row.count),
    0,
  );
  const signals = topSignals(claims, 5).map(toTrailStep);
  const tagCount = claims.length - totalClaims(claims);

  const costNode =
    exactCostUsd > 0 ? (
      <StatReadout
        label="model cost"
        value={`$${exactCostUsd.toFixed(4)}`}
        hint="Exact, as billed by the provider."
      />
    ) : estimatedCostUsd > 0 ? (
      <StatReadout
        label="model cost"
        value={`$${estimatedCostUsd.toFixed(4)}`}
        hint="Estimated from list prices, not a bill."
      />
    ) : (
      <StatReadout
        label="model cost"
        value={null}
        hint="No model call reported a cost for this run."
      />
    );

  const cohortRanAfter =
    cohortLatest !== null &&
    latestRun !== null &&
    cohortLatest.requestedAt > latestRun.requestedAt;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="grid gap-4 sm:grid-cols-2 min-[1200px]:grid-cols-4">
        <StatReadout label="signal claims" value={totalClaims(claims)} />
        <StatReadout label="tag rows" value={tagCount} hint="Not counted as evidence." />
        <StatReadout
          label="engines"
          value={engineCounts.length}
          hint={`Across ${runCount} ${runCount === 1 ? "run" : "runs"}.`}
        />
        {costNode}
        <StatReadout
          label="model calls"
          value={llmRequestCount}
          hint={`${llmTokenCount} tokens across the run`}
        />
      </div>

      <div className="grid gap-6 min-[900px]:grid-cols-2">
        <Panel
          as="section"
          interactive={false}
          padded
          ariaLabel="Claim counts by engine"
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
              Claim counts by engine
            </h3>
            <span className={cn(VALUE_CLASS, "text-[11.5px] text-[var(--text-tertiary,#64646f)]")}>
              latest run
            </span>
          </div>
          {engineCounts.length === 0 ? (
            <p className="text-[13px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
              No signal claims in the latest run. A run that stored nothing names
              the engines that did not return on the coverage panel.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {engineCounts.map((row) => (
                <li key={row.engine} className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={cn(LABEL_CLASS, "text-[var(--text-secondary,#9797a3)]")}>
                      {row.label}
                    </span>
                    <span className={cn(VALUE_CLASS, "text-[12.5px] text-[var(--text-primary,#eeeef2)]")}>
                      {row.count}
                    </span>
                  </span>
                  <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-inset,#0e0e13)]">
                    <span
                      className="block h-full rounded-full bg-[var(--accent,#e2a339)]"
                      style={{ width: `${barWidthPct(row.count, maxCount)}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          as="section"
          interactive={false}
          padded
          ariaLabel="Top signals"
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
              Top signals
            </h3>
            {onOpenSignals ? (
              <Button variant="ghost" size="sm" onClick={onOpenSignals}>
                See all signals
              </Button>
            ) : null}
          </div>
          <Trail steps={signals} density="inline" />
        </Panel>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
          freshness
        </span>
        {latestRun === null ? (
          <span className="text-[13px] text-[var(--text-secondary,#9797a3)]">
            No run has fetched this brand yet.
          </span>
        ) : (
          <span className="text-[13px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
            This profile reads the run of {formatStamp(latestRun.requestedAt)}
            {latestRun.status === "partial"
              ? ", which was partial: at least one engine did not return."
              : latestRun.status === "failed"
                ? ", which failed. Numbers below cover whatever was stored."
                : "."}
            {cohortRanAfter && cohortLatest !== null ? (
              <>
                {" "}
                The same cohort ran again on {formatStamp(cohortLatest.requestedAt)}; this
                brand&apos;s latest stored data is the earlier run.
              </>
            ) : null}
          </span>
        )}
      </div>

      <p className="text-[12px] leading-[1.45] text-[var(--text-tertiary,#64646f)]">
        {engineLabel("llm_tag")} rows are excluded from signal counts; they tag a
        content claim rather than adding evidence.
      </p>
    </div>
  );
}
