"use client";


import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Rss } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { EmptyState, Panel, Skeleton, SkeletonRegion, VALUE_CLASS, iconProps } from "@/components/drishti";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import {
  isContentClaim,
  tagBearingClaims,
  tagsForClaim,
  type ClaimDoc,
} from "@/components/drishti/brands/brand-model";
import { gridSortOptionsFrom } from "@/components/drishti/brands/EvidenceGrid";
import {
  engineOptionsFrom,
  evidencePageLabel,
  freshnessOptionsFrom,
  funnelOptionsFrom,
  hookOptionsFrom,
  matchesBrandFilters,
} from "@/components/drishti/brands/filters/filters-model";
import type { FeedBrandInfo } from "@/components/drishti/feed/FeedCard";
import { FeedFilterBar } from "@/components/drishti/feed/FeedFilterBar";
import { FeedGrid } from "@/components/drishti/feed/FeedGrid";
import {
  brandOptionsFrom,
  describeActiveFeedFilters,
  isDefaultFeedFilters,
} from "@/components/drishti/feed/feed-model";
import { useFeedFilters } from "@/components/drishti/feed/useFeedFilters";
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
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="type-display flex items-center gap-2.5 text-fg">
          <Rss {...iconProps} size={22} aria-hidden="true" className="size-6" />
          Feed
        </h1>
        <p className="type-body max-w-2xl text-fg-secondary">
          Recent evidence across every tracked brand, newest first. Filter it the same way you would one
          brand&rsquo;s Evidence tab, plus which brand it belongs to.
        </p>
      </header>
      <QueryBoundary label="The feed">
        <FeedBody />
      </QueryBoundary>
    </div>
  );
}

function FeedBody() {
  const [nowMs] = useState(() => Date.now());

  const brandsQuery = useQuery(api.brands.listBrands);
  const brands = useMemo(() => brandsQuery ?? [], [brandsQuery]);
  const brandsLoading = brandsQuery === undefined;
  const brandIds = useMemo(() => brands.map((brand) => brand._id), [brands]);

  const feedQuery = useQuery(api.claims.overviewFeed, brandIds.length > 0 ? { brandIds } : "skip");
  const feedLoading = brandIds.length > 0 && feedQuery === undefined;

  const totalCount = useMemo(() => (feedQuery ?? []).reduce((sum, entry) => sum + entry.totalCount, 0), [feedQuery]);
  const allClaims: ClaimDoc[] = useMemo(() => (feedQuery ?? []).flatMap((entry) => entry.recent), [feedQuery]);
  const recentCount = allClaims.length;
  const isBounded = totalCount > recentCount;

  const contentClaims = useMemo(() => allClaims.filter(isContentClaim), [allClaims]);
  const tags = useMemo(() => tagBearingClaims(allClaims), [allClaims]);

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

  const { filters, setFilter, resetFilters } = useFeedFilters();

  const filtered = useMemo(
    () =>
      contentClaims.filter(
        (claim) =>
          (filters.brand === "all" || String(claim.brandId) === filters.brand) &&
          matchesBrandFilters(claim, tagsForClaim(tags, claim), filters, nowMs),
      ),
    [contentClaims, tags, filters, nowMs],
  );

  const brandOptions = useMemo(() => brandOptionsFrom(contentClaims, brands), [contentClaims, brands]);
  const engineOptions = useMemo(() => engineOptionsFrom(contentClaims), [contentClaims]);
  const hookOptions = useMemo(() => hookOptionsFrom(tags), [tags]);
  const funnelOptions = useMemo(() => funnelOptionsFrom(tags), [tags]);
  const freshnessOptions = useMemo(() => freshnessOptionsFrom(contentClaims, nowMs), [contentClaims, nowMs]);
  const sortOptions = useMemo(() => gridSortOptionsFrom(filtered), [filtered]);

  const loading = brandsLoading || feedLoading;

  if (loading) return <FeedSkeleton />;

  if (brands.length === 0) {
    return (
      <Panel as="section" interactive={false} padded ariaLabel="Start tracking a brand" className="rounded-lg p-8 shadow-xs">
        <EmptyState
          icon={<Rss {...iconProps} size={20} aria-hidden="true" />}
          title="No brands to show a feed for yet"
          description="Add a tracked brand, and its evidence appears here the moment the first check completes."
          action={
            <Link
              href="/brands?add=1"
              className="inline-flex h-8 items-center rounded-sm border border-border-strong px-3 text-[13px] text-fg hover:bg-bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Add a brand
            </Link>
          }
        />
      </Panel>
    );
  }

  if (contentClaims.length === 0) {
    return (
      <Panel as="section" interactive={false} padded ariaLabel="No evidence yet" className="rounded-lg p-8 shadow-xs">
        <EmptyState
          icon={<Rss {...iconProps} size={20} aria-hidden="true" />}
          title="No findings yet for your tracked brands"
          description={`${brands.length === 1 ? "Your tracked brand has" : `All ${brands.length} tracked brands have`} no stored evidence yet. Run a check from a brand's profile, and its findings show up here.`}
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
        <div className="flex items-baseline gap-2">
          <span className={cn(VALUE_CLASS, "text-[20px] text-fg")}>{totalCount.toLocaleString()}</span>
          <span className="text-[13px] text-fg-secondary">
            stored finding{totalCount === 1 ? "" : "s"} across {brands.length} tracked brand{brands.length === 1 ? "" : "s"}
          </span>
        </div>
        {isBounded ? (
          <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>newest {recentCount} shown</span>
        ) : null}
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
