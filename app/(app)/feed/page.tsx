"use client";


import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { EmptyState, PageHeader, Panel, Skeleton, SkeletonRegion, VALUE_CLASS, pillClasses } from "@/components/drishti";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import {
  isContentClaim,
  isSignalClaim,
  tagBearingClaims,
  tagsForClaim,
  type ClaimDoc,
} from "@/components/drishti/brands/brand-model";
import { gridSortOptionsFrom } from "@/components/drishti/brands/EvidenceGrid";
import {
  engineOptionsFrom,
  fetchedAtBounds,
  evidencePageLabel,
  freshnessOptionsFrom,
  funnelOptionsFrom,
  hookOptionsFrom,
  matchesBrandFilters,
} from "@/components/drishti/brands/filters/filters-model";
import type { FeedBrandInfo } from "@/components/drishti/feed/FeedCard";
import { OffTopicNotice } from "@/components/drishti/brands/filters/OffTopicNotice";
import { offTopicIds } from "@/components/drishti/brands/topicality";
import { FeedFilterBar } from "@/components/drishti/feed/FeedFilterBar";
import { FeedGrid } from "@/components/drishti/feed/FeedGrid";
import {
  brandOptionsFrom,
  describeActiveFeedFilters,
  feedCountLine,
  isDefaultFeedFilters,
} from "@/components/drishti/feed/feed-model";
import { useFeedFilters } from "@/components/drishti/feed/useFeedFilters";
import { useAddBrandHref } from "@/components/drishti/brands/useAddBrandHref";
import { cn } from "@/lib/utils";

export function FeedSkeleton() {
  return (
    <SkeletonRegion label="Loading the feed" className="flex flex-col gap-4">
      <Skeleton variant="row" height={40} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <Skeleton key={index} variant="block" height={220} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export default function FeedPage() {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        eyebrow="Feed"
        title="Recent evidence, newest first"
        sub="Every tracked brand in one stream. Filter it like a brand's Evidence tab, plus which brand it belongs to."
      />
      <QueryBoundary label="The feed">
        <FeedBody />
      </QueryBoundary>
    </div>
  );
}

function FeedBody() {
  const addBrandHref = useAddBrandHref();
  const [nowMs] = useState(() => Date.now());

  const brandsQuery = useQuery(api.brands.listBrands);
  const brands = useMemo(() => brandsQuery ?? [], [brandsQuery]);
  const brandsLoading = brandsQuery === undefined;
  const brandIds = useMemo(() => brands.map((brand) => brand._id), [brands]);

  const { filters, setFilter, resetFilters } = useFeedFilters();
  const feedArgs = useMemo(() => {
    const scopedIds =
      filters.brand === "all" ? brandIds : brandIds.filter((id) => String(id) === filters.brand);
    return {
      brandIds: scopedIds,
      ...(filters.engine !== "all" ? { engine: filters.engine } : {}),
      ...(filters.hook !== "all" ? { hook: filters.hook } : {}),
      ...(filters.funnel !== "all" ? { funnel: filters.funnel } : {}),
      ...fetchedAtBounds(filters, nowMs),
    };
  }, [brandIds, filters, nowMs]);

  const feedQuery = useQuery(api.claims.overviewFeed, brandIds.length > 0 ? feedArgs : "skip");
  const optionsQuery = useQuery(api.claims.overviewFeed, brandIds.length > 0 ? { brandIds } : "skip");
  const feedLoading = brandIds.length > 0 && (feedQuery === undefined || optionsQuery === undefined);

  const evidenceSummaryQuery = useQuery(
    api.claims.evidenceSummaryByBrands,
    brandIds.length > 0 ? { brandIds } : "skip",
  );
  const evidenceSummaryLoading = brandIds.length > 0 && evidenceSummaryQuery === undefined;
  const totalCount = useMemo(
    () => (evidenceSummaryQuery ?? []).reduce((sum, entry) => sum + entry.evidenceCount, 0),
    [evidenceSummaryQuery],
  );
  const allClaims: ClaimDoc[] = useMemo(() => (feedQuery ?? []).flatMap((entry) => entry.recent), [feedQuery]);
  const recentCount = useMemo(() => allClaims.filter(isSignalClaim).length, [allClaims]);
  const matchingCount = useMemo(
    () => (feedQuery ?? []).reduce((sum, entry) => sum + entry.matchingCount, 0),
    [feedQuery],
  );

  const contentClaims = useMemo(() => allClaims.filter(isContentClaim), [allClaims]);
  const tags = useMemo(
    () => tagBearingClaims((feedQuery ?? []).flatMap((entry) => [...entry.recent, ...entry.tags])),
    [feedQuery],
  );
  const optionClaims = useMemo(
    () => (optionsQuery ?? []).flatMap((entry) => entry.recent).filter(isContentClaim),
    [optionsQuery],
  );
  const optionTags = useMemo(
    () => tagBearingClaims((optionsQuery ?? []).flatMap((entry) => [...entry.recent, ...entry.tags])),
    [optionsQuery],
  );

  const brandNameById = useMemo(
    () => Object.fromEntries(brands.map((brand) => [String(brand._id), brand.name])),
    [brands],
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

  const matching = useMemo(
    () =>
      contentClaims.filter(
        (claim) =>
          (filters.brand === "all" || String(claim.brandId) === filters.brand) &&
          matchesBrandFilters(claim, tagsForClaim(tags, claim), filters, nowMs),
      ),
    [contentClaims, tags, filters, nowMs],
  );
  const offTopicClaims = useMemo(() => {
    const brandDocById = new Map(brands.map((brand) => [String(brand._id), brand]));
    const ids = offTopicIds(contentClaims, brandDocById);
    return new Set(matching.filter((claim) => ids.has(String(claim._id))));
  }, [matching, contentClaims, brands]);
  const showOffTopic = filters.offtopic === "show";
  const filtered = useMemo(
    () => (showOffTopic ? matching : matching.filter((claim) => !offTopicClaims.has(claim))),
    [matching, offTopicClaims, showOffTopic],
  );

  const brandOptions = useMemo(() => brandOptionsFrom(optionClaims, brands), [optionClaims, brands]);
  const engineOptions = useMemo(() => engineOptionsFrom(optionClaims), [optionClaims]);
  const hookOptions = useMemo(() => hookOptionsFrom(optionTags), [optionTags]);
  const funnelOptions = useMemo(() => funnelOptionsFrom(optionTags), [optionTags]);
  const freshnessOptions = useMemo(() => freshnessOptionsFrom(optionClaims, nowMs), [optionClaims, nowMs]);
  const sortOptions = useMemo(() => gridSortOptionsFrom(filtered), [filtered]);

  const loading = brandsLoading || feedLoading || evidenceSummaryLoading;

  if (loading) return <FeedSkeleton />;

  if (brands.length === 0) {
    return (
      <Panel as="section" interactive={false} padded ariaLabel="Start tracking a brand" className="rounded-lg p-8 shadow-xs">
        <EmptyState
          title="No brands to show a feed for yet"
          description="Add a tracked brand, and its evidence appears here the moment the first check completes."
          action={
            <Link
              href={addBrandHref}
              scroll={false}
              className={pillClasses("ink", "sm")}
            >
              Track a brand
            </Link>
          }
        />
      </Panel>
    );
  }

  if (optionClaims.length === 0) {
    return (
      <Panel as="section" interactive={false} padded ariaLabel="No evidence yet" className="rounded-lg p-8 shadow-xs">
        <EmptyState
          title="No findings yet for your tracked brands"
          description={`${brands.length === 1 ? "Your tracked brand has" : `All ${brands.length} tracked brands have`} no stored evidence yet. Run a check from a brand's profile, and its findings show up here.`}
          action={
            <Link href="/brands" className={pillClasses("outline", "sm")}>
              Open brands
            </Link>
          }
        />
      </Panel>
    );
  }

  const isDefault = isDefaultFeedFilters(filters);
  const emptyMessage =
    describeActiveFeedFilters(filters, brandNameById) ?? "No evidence matches these filters.";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn(VALUE_CLASS, "text-[13px] text-fg-secondary")}>
          {feedCountLine({ shown: filtered.length, matching: matchingCount, recent: recentCount, total: totalCount, brands: brands.length })}
        </p>
      </div>
      <FeedFilterBar
        filters={filters}
        setFilter={setFilter}
        resetFilters={resetFilters}
        brandOptions={brandOptions}
        engineOptions={engineOptions}
        hookOptions={hookOptions}
        funnelOptions={funnelOptions}
        freshnessOptions={freshnessOptions}
        sortOptions={sortOptions}
        isDefault={isDefault}
      />
      <OffTopicNotice
        hiddenCount={offTopicClaims.size}
        subject="the brand they were found for"
        showing={showOffTopic}
        onToggle={() => setFilter("offtopic", showOffTopic ? "hide" : "show")}
      />
      <FeedGrid
        claims={filtered}
        brandById={brandById}
        sort={filters.sort}
        emptyMessage={emptyMessage}
        pageLabel={evidencePageLabel("Feed", filters)}
      />
    </div>
  );
}
