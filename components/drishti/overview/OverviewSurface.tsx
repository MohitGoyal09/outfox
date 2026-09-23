"use client";

import { useQuery } from "convex/react";
import { ArrowUpRight, Radar, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { api } from "@/convex/_generated/api";
import { EmptyState, Panel, StatReadout, iconProps } from "@/components/drishti";
import { useAllRuns } from "@/components/drishti/cohorts/useAllRuns";

import { ActionLink } from "./ActionLink";
import { EmergingPanel } from "./EmergingPanel";
import { NeedsAttention } from "./NeedsAttention";
import { NewestEvidence } from "./NewestEvidence";
import { OverviewErrorBoundary } from "./OverviewErrorBoundary";
import { PickUpWhereYouLeftOff } from "./PickUpWhereYouLeftOff";
import {
  brandCoverage,
  composeEmerging,
  composeNeedsAttention,
  composeNewestEvidence,
  recentBoards,
  recentThreads,
  type BrandLike,
  type BrandNameById,
  type FeedClaim,
  type RunLike,
} from "./overview-model";

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
  const [nowMs] = useState(() => Date.now());

  const brandsQuery = useQuery(api.brands.listBrands);
  const brands = useMemo(() => brandsQuery ?? [], [brandsQuery]);
  const brandsLoading = brandsQuery === undefined;

  const brandLikes: BrandLike[] = useMemo(
    () => brands.map((brand) => ({ id: String(brand._id), name: brand.name, domain: brand.domain })),
    [brands],
  );
  const brandNameById: BrandNameById = useMemo(
    () => Object.fromEntries(brandLikes.map((brand) => [brand.id, brand.name])),
    [brandLikes],
  );
  const brandIds = useMemo(() => brands.map((brand) => brand._id), [brands]);

  const { runs, isLoading: runsLoading } = useAllRuns();
  const runLikes: RunLike[] = useMemo(
    () =>
      runs.map((run) => ({
        id: String(run._id),
        brandIds: run.brandIds.map((id) => String(id)),
        status: run.status,
        requestedAt: run.requestedAt,
        completedAt: run.completedAt ?? null,
        errorMessage: run.errorMessage ?? null,
      })),
    [runs],
  );

  const feedQuery = useQuery(
    api.claims.overviewFeed,
    brandIds.length > 0 ? { brandIds } : "skip",
  );
  const feedLoading = brandIds.length > 0 && feedQuery === undefined;

  const totalClaimCount = useMemo(
    () => (feedQuery ?? []).reduce((sum, entry) => sum + entry.totalCount, 0),
    [feedQuery],
  );
  const claims: FeedClaim[] = useMemo(
    () =>
      (feedQuery ?? []).flatMap((entry) =>
        entry.recent.map((claim) => ({
          id: String(claim._id),
          runId: String(claim.runId),
          brandId: String(claim.brandId),
          text: claim.text,
          sourceEngine: claim.sourceEngine,
          hookType: claim.hookType ?? null,
          fetchedAt: claim.fetchedAt,
          evidenceUrl: claim.evidenceUrl,
        })),
      ),
    [feedQuery],
  );

  const threadsQuery = useQuery(api.messages.listThreads, {});
  const boardsQuery = useQuery(api.boards.listBoards, {});

  const panelsLoading = brandsLoading || runsLoading || feedLoading;

  const coverage = useMemo(() => brandCoverage(brandLikes, runLikes), [brandLikes, runLikes]);
  const coveredBrandCount = useMemo(
    () => [...coverage.values()].filter((entry) => entry.hasData).length,
    [coverage],
  );
  const attentionRows = useMemo(
    () =>
      panelsLoading
        ? []
        : composeNeedsAttention({ brands: brandLikes, runs: runLikes, claims, brandNameById, nowMs }),
    [panelsLoading, brandLikes, runLikes, claims, brandNameById, nowMs],
  );
  const evidenceFeed = useMemo(() => composeNewestEvidence(claims, brandNameById), [claims, brandNameById]);
  const emerging = useMemo(() => composeEmerging(claims, coverage, brandNameById), [claims, coverage, brandNameById]);

  const threads = useMemo(() => recentThreads(threadsQuery ?? []), [threadsQuery]);
  const boards = useMemo(
    () => recentBoards((boardsQuery ?? []).map((board) => ({ id: String(board._id), name: board.name, createdAt: board.createdAt }))),
    [boardsQuery],
  );
  const activityLoading = threadsQuery === undefined || boardsQuery === undefined;

  if (brandsQuery !== undefined && brands.length === 0) return <Onboarding />;

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h1 className="type-display text-fg">{`Good ${greeting}.`}</h1>
          <p className="type-body max-w-2xl text-fg-secondary">
            A grounded read of the latest stored evidence across your tracked brands.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <StatReadout label="Tracked brands" value={brands.length} layout="inline" loading={brandsLoading} />
          <StatReadout
            label="Stored claims"
            value={totalClaimCount}
            layout="inline"
            loading={brandsLoading || feedLoading}
          />
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
              href="/ask"
              variant="primary"
              size="sm"
              icon={<ArrowUpRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}
            >
              Ask Drishti
            </ActionLink>
          </div>
        </div>
      </header>

      <NeedsAttention rows={attentionRows} />

      {/* Section 3 — Newest Evidence, the part that is alive every day, plus
          the pooled pattern across the brands that do have data beside it. */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <NewestEvidence loading={panelsLoading} hasBrands={brands.length > 0} feed={evidenceFeed} nowMs={nowMs} />
        </div>
        <div className="lg:col-span-4">
          <EmergingPanel loading={panelsLoading} coveredBrandCount={coveredBrandCount} emerging={emerging} />
        </div>
      </section>

      <PickUpWhereYouLeftOff loading={activityLoading} threads={threads} boards={boards} nowMs={nowMs} />
    </div>
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
