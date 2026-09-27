"use client";

import { useMemo, type ReactNode } from "react";
import { isContentClaim, tagsForClaim, type ClaimDoc, type SnapshotDoc } from "./brand-model";
import { EvidenceGrid, evidenceCardCount, gridSortOptionsFrom } from "./EvidenceGrid";
import { FilterBar } from "./filters/FilterBar";
import {
  describeActiveBrandFilters,
  engineOptionsFrom,
  evidencePageLabel,
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
  tabLabel,
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
  tabLabel: string;
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
  const cardCount = useMemo(() => evidenceCardCount(filtered), [filtered]);
  const filterDescription = useMemo(() => describeActiveBrandFilters(filters), [filters]);

  return (
    <div>
      {heading ? <div className="mb-3">{heading(cardCount)}</div> : null}
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
        emptyMessage={
          contentClaims.length === 0
            ? "No findings yet for the latest check."
            : (filterDescription ?? "No evidence matches these filters.")
        }
        pageLabel={evidencePageLabel(tabLabel, filters)}
      />
    </div>
  );
}
