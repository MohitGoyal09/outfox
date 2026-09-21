"use client";

import { AgentPanel } from "@/components/AgentPanel";
import { AskBar } from "@/components/AskBar";
import { BriefView, type BriefClaimRef } from "@/components/BriefView";
import { ComparisonMatrix } from "@/components/ComparisonMatrix";
import { CrossBrandChart } from "@/components/CrossBrandChart";
import { UsageMeter } from "@/components/UsageMeter";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useMemo, useState } from "react";

const BRAND_ID_RE = /^[a-z0-9_]+$/i;
const MAX_BRANDS = 6;

export default function ComparePage({
  params,
}: {
  params: Promise<{ cohortKey: string }>;
}) {
  const { cohortKey: rawKey } = use(params);
  const cohortKey = decodeURIComponent(rawKey ?? "");
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "live" ? "live" : "cached";
  const runComparison = useAction(api.pipeline.runComparison.runComparison);

  const segments = useMemo(
    () =>
      cohortKey === ""
        ? []
        : cohortKey
            .split(":")
            .map((s) => s.trim())
            .filter((s) => s !== ""),
    [cohortKey],
  );
  const { cohortError, brandIdStrings } = useMemo(() => {
    if (cohortKey === "") return { cohortError: null, brandIdStrings: [] as string[] };
    if (segments.length === 0)
      return {
        cohortError: "No brand ids in this cohort key.",
        brandIdStrings: [] as string[],
      };
    if (segments.length > MAX_BRANDS)
      return {
        cohortError: `Too many brands in this cohort key: limit is ${MAX_BRANDS}.`,
        brandIdStrings: [] as string[],
      };
    if (segments.some((s) => BRAND_ID_RE.test(s) === false))
      return {
        cohortError: "Invalid brand id in this cohort key.",
        brandIdStrings: [] as string[],
      };
    return { cohortError: null, brandIdStrings: segments };
  }, [cohortKey, segments]);
  const brandIds = brandIdStrings as Id<"brands">[];

  const brands = useQuery(api.brands.listBrands);
  const run = useQuery(
    api.runs.latestForCohort,
    cohortError !== null || cohortKey === "" ? "skip" : { cohortKey },
  );
  const brief = useQuery(
    api.briefs.latestForCohort,
    cohortError !== null || cohortKey === "" ? "skip" : { cohortKey },
  );
  const claims = useQuery(
    api.claims.byRun,
    run?._id ? { runId: run._id } : "skip",
  );
  const llmUsage = useQuery(
    api.llmUsage.usageForRun,
    run?._id ? { runId: run._id } : "skip",
  );

  const [confirmingRefresh, setConfirmingRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshDone, setRefreshDone] = useState<string | null>(null);

  const brandNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of brands ?? []) map[String(b._id)] = b.name;
    for (const id of brandIdStrings) {
      if (!map[id]) map[id] = id.slice(0, 8);
    }
    return map;
  }, [brands, brandIdStrings]);

  const matrixBrands = useMemo(
    () =>
      brandIdStrings.map((id) => ({
        id,
        name: brandNameById[id] ?? id.slice(0, 8),
      })),
    [brandIdStrings, brandNameById],
  );

  const briefClaims: BriefClaimRef[] = useMemo(
    () =>
      (claims ?? []).map((c) => ({
        id: String(c._id),
        text: c.text,
        sourceQuery: c.sourceQuery,
        evidenceUrl: c.evidenceUrl,
        fetchedAt: c.fetchedAt,
        ...(c.value !== undefined ? { value: c.value } : {}),
        ...(c.metric !== undefined ? { metric: c.metric } : {}),
        brandName: brandNameById[String(c.brandId)] ?? String(c.brandId),
      })),
    [claims, brandNameById],
  );

  const planSteps = useMemo(() => {
    const plan = (run as { plan?: { steps: { id: string; capability?: string }[] } } | null | undefined)?.plan;
    const states = (run as { stepStates?: { id: string; status: "pending" | "running" | "complete" | "failed"; error?: string }[] } | null | undefined)?.stepStates;
    if (!plan) return [];
    const byId: Record<string, { status: "pending" | "running" | "complete" | "failed"; error?: string }> = {};
    for (const s of states ?? []) byId[s.id] = { status: s.status, ...(s.error ? { error: s.error } : {}) };
    return plan.steps.map((step) => ({
      id: step.id,
      ...(step.capability ? { capability: step.capability } : {}),
      status: byId[step.id]?.status ?? ("pending" as const),
      ...(byId[step.id]?.error ? { error: byId[step.id]?.error } : {}),
    }));
  }, [run]);

  async function confirmRefresh() {
    setRefreshError(null);
    setRefreshDone(null);
    if (brandIds.length === 0) return;
    setRefreshing(true);
    try {
      const out = (await runComparison({
        brandIds,
        mode: "live",
        refreshAuthorized: true,
      })) as { runId: string; status: string };
      setRefreshDone(`Refresh finished with status ${out.status}.`);
      setConfirmingRefresh(false);
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }

  if (cohortKey === "") {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <p className="text-sm text-muted-foreground">
          No cohort key in the URL.
        </p>
        <Link href="/" className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
          Back to cohorts
        </Link>
      </main>
    );
  }

  if (cohortError !== null) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <p role="alert" className="rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive">
          Invalid cohort key: {cohortError}
        </p>
        <Link href="/" className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
          Back to cohorts
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
            Back to cohorts
          </Link>
            <h1 className="type-display mt-2 text-[var(--text-primary)]">
            Evidence comparison
          </h1>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {cohortKey} · {mode === "live" ? "live refresh requested" : "cached evidence"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {confirmingRefresh ? (
            <>
              <Button disabled={refreshing} onClick={() => void confirmRefresh()}>
                {refreshing ? (
                  <>
                    <Spinner className="size-4" /> Refreshing
                  </>
                ) : (
                  "Confirm refresh"
                )}
              </Button>
              <Button
                variant="outline"
                disabled={refreshing}
                onClick={() => setConfirmingRefresh(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant={mode === "live" ? "default" : "outline"}
              onClick={() => {
                setConfirmingRefresh(true);
              }}
              disabled={brandIds.length === 0}
            >
              Run live refresh
            </Button>
          )}
        </div>
      </header>

      {refreshError ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive">
          {refreshError}
        </p>
      ) : null}
      {refreshDone ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-foreground">
          {refreshDone}
        </p>
      ) : null}

      {run === undefined || brands === undefined ? (
        <p className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <Spinner className="size-4" /> Loading cohort.
        </p>
      ) : run === null ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No run for this cohort yet. Confirm a live refresh above, or go
          back and load a cohort that already ran.
        </p>
      ) : run.status === "failed" ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive">
          Latest run failed{run.errorMessage ? `: ${run.errorMessage}` : "."} Refresh again to retry.
        </p>
      ) : run.status === "partial" ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Latest run is partial: some engines did not return. Results below
          cover what was stored.
        </p>
      ) : null}

      <UsageMeter
        requestCount={run?.requestCount}
        creditCount={run?.creditCount}
        creditsReported={run?.creditsReported}
        searchesLeftBefore={run?.searchesLeftBefore}
        searchesLeftAfter={run?.searchesLeftAfter}
        llmRequestCount={run?.llmRequestCount}
        llmTokenCount={run?.llmTokenCount}
        exactCostUsd={
          llmUsage !== undefined && llmUsage.exactCostUsd > 0
            ? llmUsage.exactCostUsd
            : undefined
        }
        estimatedCostUsd={
          llmUsage !== undefined && llmUsage.estimatedCostUsd > 0
            ? llmUsage.estimatedCostUsd
            : undefined
        }
        loading={run === undefined}
      />

      {planSteps.length > 0 ? (
        <WorkflowProgress steps={planSteps} title="Agent plan for this run" />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ComparisonMatrix
          claims={claims?.map((c) => ({
            brandId: String(c.brandId),
            ...(c.hookType ? { hookType: c.hookType } : {}),
            ...(c.funnelStage ? { funnelStage: c.funnelStage } : {}),
          }))}
          brands={matrixBrands}
          loading={claims === undefined || brands === undefined}
        />
        <CrossBrandChart
          brands={matrixBrands}
          claims={claims?.map((c) => ({ brandId: String(c.brandId) }))}
          loading={claims === undefined}
        />
      </div>

      <BriefView
        briefText={brief?.briefText}
        claims={briefClaims}
        loading={brief === undefined || claims === undefined}
      />

      <AskBar
        brandIds={brandIds}
        {...(run?._id ? { runId: run._id } : {})}
      />

      <AgentPanel brandIds={brandIdStrings} cohortKey={cohortKey} />
    </main>
  );
}
