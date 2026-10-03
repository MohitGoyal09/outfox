"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { LayoutGrid, Rows3 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isContentClaim, tagsForClaim, type ClaimDoc, type SnapshotDoc } from "./brand-model";
import { EvidenceGrid, evidenceCardCount, gridSortOptionsFrom } from "./EvidenceGrid";
import { FilterBar } from "./filters/FilterBar";
import { OffTopicNotice } from "./filters/OffTopicNotice";
import { assessTopicality } from "./topicality";
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
  heading?: (count: number, totalCount: number) => ReactNode;
  tabLabel: string;
}) {
  const contentClaims = useMemo(() => latestClaims.filter(isContentClaim), [latestClaims]);
  const matching = useMemo(
    () => contentClaims.filter((claim) => matchesBrandFilters(claim, tagsForClaim(tags, claim), filters, now)),
    [contentClaims, tags, filters, now],
  );
  const brandId = latestClaims[0]?.brandId;
  const brand = useQuery(api.brands.getBrand, brandId ? { brandId } : "skip");
  const offTopic = useMemo(
    () =>
      brand
        ? new Set(matching.filter((claim) => assessTopicality(claim, brand) === "possibly_off_topic"))
        : new Set<ClaimDoc>(),
    [matching, brand],
  );
  const showOffTopic = filters.offtopic === "show";
  const filtered = useMemo(
    () => (showOffTopic ? matching : matching.filter((claim) => !offTopic.has(claim))),
    [matching, offTopic, showOffTopic],
  );
  const engineOptions = useMemo(() => engineOptionsFrom(contentClaims), [contentClaims]);
  const hookOptions = useMemo(() => hookOptionsFrom(tags), [tags]);
  const funnelOptions = useMemo(() => funnelOptionsFrom(tags), [tags]);
  const freshnessOptions = useMemo(() => freshnessOptionsFrom(contentClaims, now), [contentClaims, now]);
  const sortOptions = useMemo(() => gridSortOptionsFrom(filtered), [filtered]);
  const cardCount = useMemo(() => evidenceCardCount(filtered), [filtered]);
  const totalCardCount = useMemo(() => evidenceCardCount(matching), [matching]);
  const filterDescription = useMemo(() => describeActiveBrandFilters(filters), [filters]);

  return (
    <div>
      {heading ? <div className="mb-3">{heading(cardCount, totalCardCount)}</div> : null}
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
        <ToggleGroup
          type="single"
          aria-label="Evidence view"
          value={filters.view}
          onValueChange={(next) => next && setFilter("view", next as BrandFilters["view"])}
          className="mt-2"
        >
          <ToggleGroupItem value="cards"><LayoutGrid aria-hidden />Cards</ToggleGroupItem>
          <ToggleGroupItem value="table"><Rows3 aria-hidden />Table</ToggleGroupItem>
        </ToggleGroup>
        <div className="mt-2">
          <OffTopicNotice
            hiddenCount={offTopic.size}
            subject={brand?.name ?? "this brand"}
            showing={showOffTopic}
            onToggle={() => setFilter("offtopic", showOffTopic ? "hide" : "show")}
          />
        </div>
      </div>
      <EvidenceGrid
        view={filters.view}
        tags={tags}
        claims={filtered}
        youtubeSnapshot={youtubeSnapshot}
        newsSnapshot={newsSnapshot}
        googleSnapshot={googleSnapshot}
        sort={filters.sort}
        emptyMessage={
          contentClaims.length === 0
            ? "No findings yet for the latest check."
            : filtered.length === 0 && offTopic.size > 0
              ? `Every matching finding may not be about ${brand?.name ?? "this brand"}. Use "Show them" above to see them.`
              : (filterDescription ?? "No evidence matches these filters.")
        }
        pageLabel={evidencePageLabel(tabLabel, filters)}
      />
    </div>
  );
}
