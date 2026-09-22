"use client";

import { AgentChat } from "@/components/drishti/ask/AgentChat";
import { BriefView, type BriefClaimRef } from "@/components/BriefView";
import { ComparisonMatrix } from "@/components/ComparisonMatrix";
import { CrossBrandChart } from "@/components/CrossBrandChart";
import { UsageMeter } from "@/components/UsageMeter";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

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
        <Card className="border-dashed shadow-none"><CardContent className="p-8"><p className="text-sm text-muted-foreground">No cohort key in the URL.</p>
        <Link href="/cohorts" className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
          Back to cohorts
        </Link>
        </CardContent></Card>
      </main>
    );
  }

  if (cohortError !== null) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertTitle>Invalid cohort</AlertTitle><AlertDescription>{cohortError}</AlertDescription></Alert>
        <Link href="/cohorts" className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
          Back to cohorts
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/cohorts" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            <ArrowLeft className="size-3.5" /> Back to cohorts
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">Evidence comparison</h1><Badge variant="outline" className="rounded-full font-mono text-[10px] uppercase tracking-[0.12em]">{mode === "live" ? "live" : "cached"}</Badge></div>
          <p className="mt-2 max-w-[70ch] break-all text-sm text-muted-foreground">{cohortKey}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {confirmingRefresh ? (
            <>
              <Button disabled={refreshing} onClick={() => void confirmRefresh()} className="gap-2">
                {refreshing ? (
                  <>
                    <Spinner className="size-4" /> Refreshing
                  </>
                ) : (
                  <><RefreshCw className="size-4" /> Confirm refresh</>
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
              <RefreshCw className="size-4" /> Run live refresh
            </Button>
          )}
        </div>
      </header>

      {refreshError ? <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertTitle>Refresh failed</AlertTitle><AlertDescription>{refreshError}</AlertDescription></Alert> : null}
      {refreshDone ? (
        <Alert className="border-emerald-500/30 bg-emerald-500/[0.04]"><AlertTitle>Refresh complete</AlertTitle><AlertDescription>{refreshDone}</AlertDescription></Alert>
      ) : null}

      {run === undefined || brands === undefined ? (
        <Card className="shadow-none"><CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Spinner className="size-4" /> Loading cohort.
        </CardContent></Card>
      ) : run === null ? (
        <Card className="border-dashed shadow-none"><CardContent className="p-6 text-sm text-muted-foreground">
          No run for this cohort yet. Confirm a live refresh above, or go
          back and load a cohort that already ran.
        </CardContent></Card>
      ) : run.status === "failed" ? (
        <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertTitle>Latest run failed</AlertTitle><AlertDescription>Latest run failed{run.errorMessage ? `: ${run.errorMessage}` : "."} Refresh again to retry.</AlertDescription></Alert>
      ) : run.status === "partial" ? (
        <Alert><AlertTriangle className="size-4 text-warn" /><AlertTitle>Partial coverage</AlertTitle><AlertDescription>Latest run is partial: some engines did not return. Results below cover what was stored.</AlertDescription></Alert>
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

      <AgentChat brandIds={brandIdStrings} cohortKey={cohortKey} />
    </main>
  );
}
