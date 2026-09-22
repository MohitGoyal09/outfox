"use client";

import { useMemo, type ReactNode } from "react";
import { isContentClaim, tagsForClaim, type ClaimDoc, type SnapshotDoc } from "./brand-model";
import { EvidenceGrid, gridSortOptionsFrom } from "./EvidenceGrid";
import { FilterBar } from "./filters/FilterBar";
import {
  engineOptionsFrom,
  freshnessOptionsFrom,
  funnelOptionsFrom,
  hookOptionsFrom,
  isDefaultBrandFilters,
  matchesBrandFilters,
  type BrandFilters,
} from "./filters/filters-model";

export function EvidenceSection({
  latestClaims,
  tags,
  filters,
  setFilter,
  resetFilters,
  now,
  youtubeSnapshot,
  newsSnapshot,
  googleSnapshot,
  heading,
}: {
  latestClaims: ClaimDoc[];
  tags: ClaimDoc[];
  filters: BrandFilters;
  setFilter: <K extends keyof BrandFilters>(key: K, value: BrandFilters[K]) => void;
  resetFilters: () => void;
  now: number;
  youtubeSnapshot?: SnapshotDoc;
  newsSnapshot?: SnapshotDoc;
  googleSnapshot?: SnapshotDoc;
  heading?: (count: number) => ReactNode;
}) {
  const contentClaims = useMemo(() => latestClaims.filter(isContentClaim), [latestClaims]);
  const filtered = useMemo(
    () => contentClaims.filter((claim) => matchesBrandFilters(claim, tagsForClaim(tags, claim), filters, now)),
    [contentClaims, tags, filters, now],
  );
  const engineOptions = useMemo(() => engineOptionsFrom(contentClaims), [contentClaims]);
  const hookOptions = useMemo(() => hookOptionsFrom(tags), [tags]);
  const funnelOptions = useMemo(() => funnelOptionsFrom(tags), [tags]);
  const freshnessOptions = useMemo(() => freshnessOptionsFrom(contentClaims, now), [contentClaims, now]);
  const sortOptions = useMemo(() => gridSortOptionsFrom(filtered), [filtered]);

  return (
    <div>
      {heading ? <div className="mb-3">{heading(filtered.length)}</div> : null}
      <div className="mb-3">
        <FilterBar
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          engineOptions={engineOptions}
          hookOptions={hookOptions}
          funnelOptions={funnelOptions}
          freshnessOptions={freshnessOptions}
          sortOptions={sortOptions}
          isDefault={isDefaultBrandFilters(filters)}
        />
      </div>
      <EvidenceGrid
        claims={filtered}
        youtubeSnapshot={youtubeSnapshot}
        newsSnapshot={newsSnapshot}
        googleSnapshot={googleSnapshot}
        sort={filters.sort}
        emptyMessage={contentClaims.length === 0 ? "No signal claims have been stored for the latest run." : "No stored evidence matches these filters."}
      />
    </div>
  );
}
