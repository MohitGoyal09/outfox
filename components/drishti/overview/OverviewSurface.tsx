"use client";

import { useQuery } from "convex/react";
import { ArrowRight, BarChart3, Building2, Quote, Radar, Search, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { offTopicIds } from "@/components/drishti/brands/topicality";
import { useBrandFilters } from "@/components/drishti/brands/filters/useBrandFilters";

import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { EmptyState, Panel, iconProps } from "@/components/drishti";
import { useAllRuns } from "@/components/drishti/cohorts/useAllRuns";
import type { ClaimDoc } from "@/components/drishti/brands/brand-model";
import type { FeedBrandInfo, FeedThumbnail } from "@/components/drishti/feed/FeedCard";

import { ActionLink } from "./ActionLink";
import { EmergingPanel } from "./EmergingPanel";
import { NeedsAttention } from "./NeedsAttention";
import { NewestEvidence } from "./NewestEvidence";
import { OverviewErrorBoundary } from "./OverviewErrorBoundary";
import { PickUpWhereYouLeftOff } from "./PickUpWhereYouLeftOff";
import { SectionLabel } from "./SectionLabel";
import { StatTile } from "./StatTile";
import { WhatChanged } from "./WhatChanged";
import {
  brandCoverage,
  composeBiggestMove,
  composeEmerging,
  composeNeedsAttention,
  composeNewestEvidence,
  composeWhatChanged,
  recentBoards,
  recentThreads,
  type BrandLike,
  type BrandNameById,
  type FeedClaim,
  type RunLike,
  type RunSourceCount,
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
  const ownBrandId = useMemo(() => {
    const own = brands.find((brand) => brand.isOwnBrand === true);
    return own ? String(own._id) : null;
  }, [brands]);

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

  const evidenceSummaryQuery = useQuery(
    api.claims.evidenceSummaryByBrands,
    brandIds.length > 0 ? { brandIds } : "skip",
  );
  const evidenceSummaryLoading = brandIds.length > 0 && evidenceSummaryQuery === undefined;
  const totalClaimCount = useMemo(
    () => (evidenceSummaryQuery ?? []).reduce((sum, entry) => sum + entry.evidenceCount, 0),
    [evidenceSummaryQuery],
  );
  const brandsWithFindings = useMemo(
    () => (evidenceSummaryQuery ?? []).filter((entry) => entry.evidenceCount > 0).length,
    [evidenceSummaryQuery],
  );
  const claims: FeedClaim[] = useMemo(
    () =>
      (feedQuery ?? []).flatMap((entry) =>
        [...entry.recent, ...(entry.tags ?? [])].map((claim) => ({
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
  const claimsById: ReadonlyMap<string, ClaimDoc> = useMemo(
    () => new Map((feedQuery ?? []).flatMap((entry) => entry.recent).map((claim) => [String(claim._id), claim])),
    [feedQuery],
  );
  const brandById: ReadonlyMap<string, FeedBrandInfo> = useMemo(
    () =>
      new Map(
        brands.map((brand) => [
          String(brand._id),
          { id: String(brand._id), name: brand.name, domain: brand.domain, isOwnBrand: brand.isOwnBrand === true },
        ]),
      ),
    [brands],
  );

  const threadsQuery = useQuery(api.messages.listThreads, {});
  const boardsQuery = useQuery(api.boards.listBoards, {});

  const panelsLoading = brandsLoading || runsLoading || feedLoading || evidenceSummaryLoading;

  const coverage = useMemo(() => brandCoverage(brandLikes, runLikes), [brandLikes, runLikes]);
  const coveredBrandCount = useMemo(
    () => [...coverage.values()].filter((entry) => entry.hasData).length,
    [coverage],
  );
  const attentionRows = useMemo(
    () =>
      panelsLoading
        ? []
        : composeNeedsAttention({ brands: brandLikes, runs: runLikes, claims, brandNameById, nowMs, ownBrandId }),
    [panelsLoading, brandLikes, runLikes, claims, brandNameById, nowMs, ownBrandId],
  );
  const { filters: homeFilters, setFilter: setHomeFilter } = useBrandFilters();
  const showOffTopic = homeFilters.offtopic === "show";
  const offTopic = useMemo(
    () =>
      offTopicIds(
        (feedQuery ?? []).flatMap((entry) => entry.recent),
        new Map(brands.map((brand) => [String(brand._id), brand])),
      ),
    [feedQuery, brands],
  );
  const evidenceClaims = useMemo(
    () => (showOffTopic ? claims : claims.filter((claim) => !offTopic.has(claim.id))),
    [claims, offTopic, showOffTopic],
  );
  const evidenceFeed = useMemo(
    () => composeNewestEvidence(evidenceClaims, brandNameById, undefined, ownBrandId),
    [evidenceClaims, brandNameById, ownBrandId],
  );
  const newestEvidenceThumbnailIds = useMemo(
    () =>
      evidenceFeed.items.flatMap((item) => {
        const claim = claimsById.get(item.id);
        return claim && (claim.sourceEngine === "google" || claim.sourceEngine === "google_news")
          ? [claim._id]
          : [];
      }),
    [evidenceFeed, claimsById],
  );
  const newestEvidenceThumbnailsQuery = useQuery(
    api.claims.feedThumbnails,
    newestEvidenceThumbnailIds.length > 0 ? { claimIds: newestEvidenceThumbnailIds } : "skip",
  );
  const newestEvidenceThumbnailById: ReadonlyMap<string, FeedThumbnail> = useMemo(() => {
    const map = new Map<string, FeedThumbnail>();
    for (const row of newestEvidenceThumbnailsQuery ?? []) map.set(String(row.claimId), row);
    return map;
  }, [newestEvidenceThumbnailsQuery]);
  const emerging = useMemo(() => composeEmerging(claims, coverage, brandNameById), [claims, coverage, brandNameById]);

  const compareRunIds = useMemo(() => {
    const ids = new Set<string>();
    for (const brand of brandLikes) {
      const cov = coverage.get(brand.id);
      if (cov?.lastFinishedRun && cov.previousFinishedRun) {
        ids.add(cov.lastFinishedRun.id);
        ids.add(cov.previousFinishedRun.id);
      }
    }
    return [...ids];
  }, [brandLikes, coverage]);

  const sourceCountsQuery = useQuery(
    api.claims.runSourceCounts,
    compareRunIds.length > 0 ? { runIds: compareRunIds as Id<"runs">[] } : "skip",
  );
  const sourceCountsLoading = compareRunIds.length > 0 && sourceCountsQuery === undefined;
  const sourceCounts: RunSourceCount[] = useMemo(
    () =>
      (sourceCountsQuery ?? []).map((row) => ({
        runId: String(row.runId),
        brandId: String(row.brandId),
        sourceEngine: row.sourceEngine,
        count: row.count,
      })),
    [sourceCountsQuery],
  );
  const signalsScope = useQuery(api.claims.signalsScope, {});
  const biggestMove = useMemo(
    () =>
      signalsScope === undefined
        ? null
        : composeBiggestMove(signalsScope.brands, signalsScope.currentClaims, signalsScope.previousClaims),
    [signalsScope],
  );
  const whatChangedFeed = useMemo(() => {
    if (panelsLoading || sourceCountsLoading || signalsScope === undefined) return null;
    const composed = composeWhatChanged(brandLikes, runLikes, sourceCounts, brandNameById, nowMs, ownBrandId);
    return { changes: [], comparableBrandCount: 0, ...composed, biggestMove };
  }, [panelsLoading, sourceCountsLoading, signalsScope, brandLikes, runLikes, sourceCounts, brandNameById, nowMs, ownBrandId, biggestMove]);

  const threads = useMemo(() => recentThreads(threadsQuery ?? []), [threadsQuery]);
  const boards = useMemo(
    () => recentBoards((boardsQuery ?? []).map((board) => ({ id: String(board._id), name: board.name, createdAt: board.createdAt }))),
    [boardsQuery],
  );
  const newestBoardId = boardsQuery?.find((board) => String(board._id) === boards[0]?.id)?._id;
  const newestBoardItems = useQuery(api.boards.listItems, newestBoardId ? { boardId: newestBoardId } : "skip");
  const newestBoardItemCount = newestBoardItems === undefined ? null : newestBoardItems.length;
  const activityLoading = threadsQuery === undefined || boardsQuery === undefined;

  if (brandsQuery !== undefined && brands.length === 0) return <Onboarding />;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h1 className="type-display text-fg">{`Good ${greeting}.`}</h1>
          <p className="type-body max-w-2xl text-fg-secondary">
            A grounded read of the newest evidence across your tracked brands.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            icon={<ArrowRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}
          >
            Ask Drishti
          </ActionLink>
        </div>
      </header>

      <section aria-label="At a glance" className="flex flex-col gap-3">
        <SectionLabel>At a glance</SectionLabel>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Tracked brands"
            value={brands.length}
            loading={brandsLoading}
            hint={`${coveredBrandCount} with a finished check`}
            icon={<Building2 {...iconProps} size={16} aria-hidden="true" className="size-4" />}
          />
          <StatTile
            label="All stored findings"
            labelInfo="Every finding stored for your tracked brands, summed across all of their checks. Signals counts only each brand's latest check, so its number is smaller."
            value={totalClaimCount}
            accent="ok"
            loading={panelsLoading}
            hint={`across ${brandsWithFindings} of ${brands.length} brands, every check`}
            icon={<Quote {...iconProps} size={16} aria-hidden="true" className="size-4" />}
          />
          <StatTile
            label="With evidence"
            value={coveredBrandCount}
            accent={coveredBrandCount > 0 ? "ok" : "neutral"}
            loading={panelsLoading}
            hint={`of ${brands.length} tracked brands`}
            icon={<BarChart3 {...iconProps} size={16} aria-hidden="true" className="size-4" />}
          />
          <StatTile
            label="Needs attention"
            value={attentionRows.length}
            accent={attentionRows.length > 0 ? "warn" : "ok"}
            loading={panelsLoading}
            hint={
              attentionRows.length > 0
                ? `of ${brands.length} tracked brands`
                : `all ${brands.length} look current`
            }
            icon={<TriangleAlert {...iconProps} size={16} aria-hidden="true" className="size-4" />}
          />
        </div>
      </section>

      {/* Needs attention and What changed sit side by side. Either can render
          nothing; when only one survives it takes the full row. */}
      {attentionRows.length > 0 || whatChangedFeed !== null ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {attentionRows.length > 0 ? (
            <div className={whatChangedFeed === null ? "lg:col-span-2" : undefined}>
              <NeedsAttention rows={attentionRows} />
            </div>
          ) : null}
          {whatChangedFeed !== null ? (
            <div className={attentionRows.length === 0 ? "lg:col-span-2" : undefined}>
              <WhatChanged feed={whatChangedFeed} />
            </div>
          ) : null}
        </div>
      ) : null}

      <section aria-label="Evidence and patterns" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <NewestEvidence
            loading={panelsLoading}
            hasBrands={brands.length > 0}
            feed={evidenceFeed}
            claimsById={claimsById}
            brandById={brandById}
            thumbnailByClaimId={newestEvidenceThumbnailById}
            hiddenCount={offTopic.size}
            showOffTopic={showOffTopic}
            onToggleOffTopic={() => setHomeFilter("offtopic", showOffTopic ? "hide" : "show")}
          />
        </div>
        <div className="lg:col-span-4">
          <EmergingPanel loading={panelsLoading} coveredBrandCount={coveredBrandCount} emerging={emerging} />
        </div>
      </section>

      <PickUpWhereYouLeftOff loading={activityLoading} threads={threads} boards={boards} newestBoardItemCount={newestBoardItemCount} nowMs={nowMs} />
    </div>
  );
}

function Onboarding() {
  return (
    <Panel as="section" interactive={false} padded ariaLabel="Start with your brands" className="mx-auto max-w-3xl rounded-lg p-8 shadow-xs sm:p-12">
      <EmptyState
        size="md"
        icon={<Radar {...iconProps} size={20} aria-hidden="true" />}
        title="Start with the brands you want to understand"
        description="Add a brand, then Drishti builds a source-backed profile across Search, YouTube, Trends, and Ads Transparency where data is available."
        action={
          <>
            <ActionLink href="/onboarding" variant="primary">
              Add your first brand
            </ActionLink>
            <ActionLink
              href="/ask"
              variant="ghost"
              icon={<ArrowRight {...iconProps} size={16} aria-hidden="true" className="size-4" />}
            >
              Ask Drishti
            </ActionLink>
          </>
        }
      />
    </Panel>
  );
}
