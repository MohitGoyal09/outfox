"use client";

import { useQuery } from "convex/react";
import { ArrowRight, ArrowUpRight, Plus, Radar, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { api } from "@/convex/_generated/api";
import { EmptyState, Panel, StatReadout, iconProps } from "@/components/drishti";

import { ActionLink } from "./ActionLink";
import { AttentionPanel } from "./AttentionPanel";
import { ClaimsOfTheDay } from "./ClaimsOfTheDay";
import { EmergingPanel } from "./EmergingPanel";
import { OverviewErrorBoundary } from "./OverviewErrorBoundary";
import { SectionLabel } from "./SectionLabel";
import { SinceLastRun } from "./SinceLastRun";
import {
  buildClaimFeed,
  cohortCounts,
  cohortKeyFromBrands,
  composeAttention,
  composeDigest,
  composeEmerging,
  composeUsage,
  hasReportedUsage,
  runHref,
  type BrandNameById,
  type ClaimLike,
} from "./digest";

const ASK_NEXT_QUESTIONS = [
  "What changed since the last run?",
  "Which claims are shared across brands?",
  "Where is the evidence incomplete?",
] as const;

export function OverviewSurface() {
  return (
    <OverviewErrorBoundary>
      <OverviewBody />
    </OverviewErrorBoundary>
  );
}

function greetingWord(hour: number): string {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function OverviewBody() {
  const [greeting] = useState(() => greetingWord(new Date().getHours()));
  const brandsQuery = useQuery(api.brands.listBrands);
  const brands = useMemo(() => brandsQuery ?? [], [brandsQuery]);
  const brandNameById: BrandNameById = useMemo(
    () => Object.fromEntries(brands.map((brand) => [String(brand._id), brand.name])),
    [brands],
  );
  const cohortKey = useMemo(() => cohortKeyFromBrands(brands), [brands]);
  const runQuery = useQuery(api.runs.latestForCohort, cohortKey ? { cohortKey } : "skip");
  const run = runQuery ?? null;
  const briefQuery = useQuery(api.briefs.latestForCohort, cohortKey ? { cohortKey } : "skip");
  const claimsQuery = useQuery(api.claims.byRun, run?._id ? { runId: run._id } : "skip");
  const usageQuery = useQuery(api.llmUsage.usageForRun, run?._id ? { runId: run._id } : "skip");

  const claims: ClaimLike[] = useMemo(
    () =>
      (claimsQuery ?? []).map((claim) => ({
        id: String(claim._id),
        text: claim.text,
        brandId: String(claim.brandId),
        sourceEngine: claim.sourceEngine,
        hookType: claim.hookType ?? null,
      })),
    [claimsQuery],
  );

  const brandsLoading = brandsQuery === undefined;
  const runLoading = cohortKey !== "" && runQuery === undefined;
  const claimsLoading = run !== null && claimsQuery === undefined;
  const panelLoading = brandsLoading || runLoading || claimsLoading;
  const runExists = run !== null;

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
  const counts = useMemo(() => cohortCounts(claims, brandNameById), [claims, brandNameById]);
  const emerging = useMemo(() => composeEmerging(claims, brandNameById), [claims, brandNameById]);
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
  const usageForPanel = runExists && hasReportedUsage(usage) ? usage : null;
  const feed = useMemo(() => buildClaimFeed(claims, brandNameById), [claims, brandNameById]);

  if (brandsQuery !== undefined && brands.length === 0) return <Onboarding />;

  const needsAttention =
    runExists &&
    (attention.status === "failed" || attention.status === "partial" || attention.gaps.length > 0);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h1 className="type-display text-fg">{`Good ${greeting}.`}</h1>
          <p className="type-body max-w-2xl text-fg-secondary">
            A grounded read of the latest stored signals across your tracked brands.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <StatReadout label="Tracked brands" value={brands.length} layout="inline" loading={brandsLoading} />
          <div className="flex gap-2">
            <ActionLink
              href="/brands"
              variant="ghost"
              size="sm"
              icon={<Search {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}
            >
              Browse brands
            </ActionLink>
            <ActionLink
              href="/cohorts"
              variant="primary"
              size="sm"
              icon={<Plus {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}
            >
              New comparison
            </ActionLink>
          </div>
        </div>
      </header>

      {/* Hero: what a growth marketer needs first -- what the latest run
          found, in words, with its evidence. Full width, real scale
          contrast against everything below it. */}
      <SinceLastRun
        brandsLoading={brandsLoading}
        cohortKey={cohortKey}
        runLoading={runLoading}
        runExists={runExists}
        runRequestedAt={run?.requestedAt ?? null}
        claimsLoading={claimsLoading}
        claimsEmpty={!claimsLoading && claims.length === 0}
        digest={digest}
        counts={counts}
      />

      {/* Second tier: is the data trustworthy (Attention, folding in run
          status + per-engine coverage + cost so a failed run is told once,
          with a way to act), and what pattern is emerging across the cohort. */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AttentionPanel
            loading={panelLoading}
            runExists={runExists}
            attention={attention}
            usage={usageForPanel}
            action={
              needsAttention ? (
                <ActionLink
                  href={runHref(cohortKey)}
                  icon={<ArrowRight {...iconProps} size={16} aria-hidden="true" className="size-4" />}
                >
                  Open run view
                </ActionLink>
              ) : null
            }
          />
        </div>
        <div className="lg:col-span-5">
          <EmergingPanel loading={panelLoading} runExists={runExists} emerging={emerging} cohortKey={cohortKey} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ClaimsOfTheDay loading={panelLoading} runExists={runExists} cohortKey={cohortKey} feed={feed} />
        </div>
        <div className="lg:col-span-4">
          <AskNext />
        </div>
      </section>
    </div>
  );
}

function AskNext() {
  return (
    <Panel as="section" interactive={false} padded ariaLabel="Ask next">
      <SectionLabel>Ask next</SectionLabel>
      <div className="mt-4 flex flex-col gap-2">
        {ASK_NEXT_QUESTIONS.map((question) => (
          <Link
            key={question}
            href={`/ask?q=${encodeURIComponent(question)}`}
            className="flex items-center justify-between gap-3 rounded-[8px] border border-border p-3 type-body text-fg transition-colors duration-150 ease-out hover:border-border-strong hover:bg-bg-inset"
          >
            <span>{question}</span>
            <ArrowUpRight
              {...iconProps}
              size={16}
              aria-hidden="true"
              className="size-4 shrink-0 text-fg-tertiary"
            />
          </Link>
        ))}
      </div>
    </Panel>
  );
}

function Onboarding() {
  return (
    <Panel as="section" interactive={false} padded ariaLabel="Start with your brands" className="mx-auto max-w-3xl p-8 sm:p-12">
      <EmptyState
        size="md"
        icon={<Radar {...iconProps} size={20} aria-hidden="true" />}
        title="Start with the brands you want to understand"
        description="Add a brand, then Drishti builds a source-backed profile across Search, YouTube, Trends, and Ads Transparency where data is available."
        action={
          <>
            <ActionLink href="/brands" variant="primary">
              Add your first brand
            </ActionLink>
            <ActionLink
              href="/ask"
              variant="ghost"
              icon={<ArrowUpRight {...iconProps} size={16} aria-hidden="true" className="size-4" />}
            >
              Ask Drishti
            </ActionLink>
          </>
        }
      />
    </Panel>
  );
}
