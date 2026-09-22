"use client";

import type { ClaimDoc, SnapshotDoc } from "../brand-model";
import { EvidenceSection } from "../EvidenceSection";
import type { BrandFilters } from "../filters/filters-model";

export function EvidenceTab({
  latestClaims,
  tags,
  filters,
  setFilter,
  resetFilters,
  now,
  youtubeSnapshot,
  newsSnapshot,
  googleSnapshot,
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
}) {
  return (
    <EvidenceSection
      latestClaims={latestClaims}
      tags={tags}
      filters={filters}
      setFilter={setFilter}
      resetFilters={resetFilters}
      now={now}
      youtubeSnapshot={youtubeSnapshot}
      newsSnapshot={newsSnapshot}
      googleSnapshot={googleSnapshot}
      heading={(count) => <h2 className="text-base font-semibold tracking-[-0.02em]">{Intl.NumberFormat("en-US").format(count)} pieces of evidence</h2>}
    />
  );
}
