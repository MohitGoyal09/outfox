"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

import { AttentionPanel } from "./AttentionPanel";
import { ClaimsOfTheDay } from "./ClaimsOfTheDay";
import { EmergingPanel } from "./EmergingPanel";
import { OverviewErrorBoundary } from "./OverviewErrorBoundary";
import { SinceLastRun } from "./SinceLastRun";
import {
  buildClaimFeed,
  cohortCounts,
  cohortKeyFromBrands,
  composeAttention,
  composeDigest,
  composeEmerging,
  composeUsage,
  type BrandNameById,
  type ClaimLike,
} from "./digest";
import { VALUE_CLASS } from "../tokens";

export function OverviewSurface() {
  return (
    <OverviewErrorBoundary>
      <OverviewBody />
    </OverviewErrorBoundary>
  );
}

function OverviewBody() {
  const brandsQuery = useQuery(api.brands.listBrands);

  const brandNameById: BrandNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const brand of brandsQuery ?? []) {
      map[String(brand._id)] = brand.name;
    }
    return map;
  }, [brandsQuery]);

  const cohortKey = useMemo(
    () => (brandsQuery ? cohortKeyFromBrands(brandsQuery) : ""),
    [brandsQuery],
  );

  const runQuery = useQuery(
    api.runs.latestForCohort,
    cohortKey === "" ? "skip" : { cohortKey },
  );
  const briefQuery = useQuery(
    api.briefs.latestForCohort,
    cohortKey === "" ? "skip" : { cohortKey },
  );
  const run = runQuery ?? null;

  const claimsQuery = useQuery(
    api.claims.byRun,
    run?._id ? { runId: run._id } : "skip",
  );
  const usageQuery = useQuery(
    api.llmUsage.usageForRun,
    run?._id ? { runId: run._id } : "skip",
  );

  const claims: ClaimLike[] = useMemo(
    () =>
      (claimsQuery ?? []).map((claim: NonNullable<typeof claimsQuery>[number]) => ({
        id: String(claim._id),
        text: claim.text,
        brandId: String(claim.brandId),
        sourceEngine: claim.sourceEngine,
        hookType: claim.hookType ?? null,
      })),
    [claimsQuery],
  );

  const counts = useMemo(
    () => cohortCounts(claims, brandNameById),
    [claims, brandNameById],
  );
  const digest = useMemo(
    () =>
      composeDigest({
        briefText: briefQuery?.briefText,
        briefMode: briefQuery?.mode,
        claims,
        brandNameById,
      }),
    [briefQuery, claims, brandNameById],
  );
  const emerging = useMemo(
    () => composeEmerging(claims, brandNameById),
    [claims, brandNameById],
  );
  const attention = useMemo(
    () =>
      composeAttention({
        runStatus: run?.status,
        errorMessage: run?.errorMessage,
        claims,
        briefText: briefQuery?.briefText,
      }),
    [run, claims, briefQuery],
  );
  const usage = useMemo(
    () =>
      composeUsage({
        requestCount: run?.requestCount,
        creditCount: run?.creditCount,
        creditsReported: run?.creditsReported,
        searchesLeftAfter: run?.searchesLeftAfter,
        llmRequestCount: run?.llmRequestCount,
        llmTokenCount: run?.llmTokenCount,
        exactCostUsd: usageQuery?.exactCostUsd,
        estimatedCostUsd: usageQuery?.estimatedCostUsd,
      }),
    [run, usageQuery],
  );
  const feed = useMemo(
    () => buildClaimFeed(claims, brandNameById),
    [claims, brandNameById],
  );

  const brandsLoading = brandsQuery === undefined;
  const runLoading = cohortKey !== "" && runQuery === undefined;
  const claimsLoading = run !== null && claimsQuery === undefined;
  const panelLoading = brandsLoading || runLoading || claimsLoading;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 border-b border-border pb-5">
        <p className="type-caption uppercase tracking-[0.14em] text-fg-tertiary">
          Evidence atlas
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="type-display text-fg">Overview</h1>
            <p className="mt-1 max-w-[62ch] type-body text-fg-secondary">
              A compact read of the latest stored evidence across your tracked brands.
            </p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="block type-caption text-fg-tertiary">tracked</span>
              <span className={cn(VALUE_CLASS, "text-fg")}>{brandsQuery?.length ?? "—"}</span>
            </div>
            <div>
              <span className="block type-caption text-fg-tertiary">latest run</span>
              <span className={cn(VALUE_CLASS, "text-fg")}>{run?.status ?? "—"}</span>
            </div>
          </div>
        </div>
      </header>

      <SinceLastRun
        brandsLoading={brandsLoading}
        cohortKey={cohortKey}
        runLoading={runLoading}
        runExists={run !== null}
        runRequestedAt={run?.requestedAt ?? null}
        claimsLoading={claimsLoading}
        claimsEmpty={run !== null && claimsQuery !== undefined && claims.length === 0}
        digest={run !== null && claims.length > 0 ? digest : null}
        counts={run !== null && claims.length > 0 ? counts : null}
      />

      <div className="grid gap-4 min-[900px]:grid-cols-2">
        <EmergingPanel
          loading={panelLoading}
          runExists={run !== null}
          emerging={emerging}
          cohortKey={cohortKey}
        />
        <AttentionPanel
          loading={panelLoading}
          runExists={run !== null}
          attention={run !== null ? attention : null}
          usage={run !== null ? usage : null}
        />
      </div>

      <ClaimsOfTheDay
        loading={panelLoading}
        runExists={run !== null}
        cohortKey={cohortKey}
        feed={run !== null && claimsQuery !== undefined ? feed : null}
      />
    </div>
  );
}
