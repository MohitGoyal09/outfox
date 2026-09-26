"use client";

import { Building2 } from "lucide-react";
import { FilterSelect } from "../brands/EvidencePanels";
import { FilterBar } from "../brands/filters/FilterBar";
import type { BrandFilters, FilterOption } from "../brands/filters/filters-model";
import type { FeedFilters } from "./feed-model";

export function FeedFilterBar({
  filters,
  setFilter,
  resetFilters,
  brandOptions,
  engineOptions,
  hookOptions,
  funnelOptions,
  freshnessOptions,
  sortOptions,
  isDefault,
}: {
  filters: FeedFilters;
  setFilter: <K extends keyof FeedFilters>(key: K, value: FeedFilters[K]) => void;
  resetFilters: () => void;
  brandOptions: FilterOption[];
  engineOptions: FilterOption[];
  hookOptions: FilterOption[];
  funnelOptions: FilterOption[];
  freshnessOptions: FilterOption[];
  sortOptions: FilterOption[];
  isDefault: boolean;
}) {
  const setBrandFilter = <K extends keyof BrandFilters>(key: K, value: BrandFilters[K]) =>
    setFilter(key as keyof FeedFilters, value as FeedFilters[keyof FeedFilters]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        icon={Building2}
        label="All brands"
        value={filters.brand}
        onChange={(value) => setFilter("brand", value)}
        options={brandOptions}
      />
      <FilterBar
        filters={filters}
        setFilter={setBrandFilter}
        resetFilters={resetFilters}
        engineOptions={engineOptions}
        hookOptions={hookOptions}
        funnelOptions={funnelOptions}
        freshnessOptions={freshnessOptions}
        sortOptions={sortOptions}
        isDefault={isDefault}
      />
    </div>
  );
}
