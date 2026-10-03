"use client";

import { useState } from "react";
import { BarChart3, CalendarRange, Filter, RotateCcw, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CONTROL_SHELL_CLASS } from "@/components/drishti/tokens";
import { FilterSelect } from "../EvidencePanels";
import { SORT_OPTIONS, type BrandFilters, type FilterOption, type FreshnessValue } from "./filters-model";

export function FilterBar({
  filters,
  setFilter,
  resetFilters,
  engineOptions,
  hookOptions,
  funnelOptions,
  freshnessOptions,
  sortOptions = SORT_OPTIONS,
  isDefault,
}: {
  filters: BrandFilters;
  setFilter: <K extends keyof BrandFilters>(key: K, value: BrandFilters[K]) => void;
  resetFilters: () => void;
  engineOptions: FilterOption[];
  hookOptions: FilterOption[];
  funnelOptions: FilterOption[];
  freshnessOptions: FilterOption[];
  sortOptions?: FilterOption[];
  isDefault: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangeControl filters={filters} setFilter={setFilter} />
      <FilterSelect
        icon={BarChart3}
        label="All sources"
        value={filters.engine}
        onChange={(value) => setFilter("engine", value)}
        options={engineOptions}
      />
      <FilterSelect
        icon={Tag}
        label="All hooks"
        value={filters.hook}
        onChange={(value) => setFilter("hook", value)}
        options={hookOptions}
      />
      <FilterSelect
        icon={Filter}
        label="All funnel stages"
        value={filters.funnel}
        onChange={(value) => setFilter("funnel", value)}
        options={funnelOptions}
      />
      <FilterSelect
        icon={CalendarRange}
        label="Any freshness"
        value={filters.freshness}
        onChange={(value) => setFilter("freshness", value as FreshnessValue)}
        options={freshnessOptions}
      />
      <label className={cn(CONTROL_SHELL_CLASS, "gap-2")}>
        <span className="sr-only">Sort</span>
        <select
          aria-label="Sort"
          value={filters.sort}
          onChange={(event) => setFilter("sort", event.target.value as BrandFilters["sort"])}
          className="appearance-none bg-transparent text-xs font-normal text-foreground outline-none"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {isDefault ? null : (
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2 text-xs text-muted-foreground" onClick={resetFilters}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      )}
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "All time", days: null },
] as const;

function presetFrom(days: number | null): string | null {
  return days === null ? null : new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);
}

function DateRangeControl({
  filters,
  setFilter,
}: {
  filters: BrandFilters;
  setFilter: <K extends keyof BrandFilters>(key: K, value: BrandFilters[K]) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const activePreset = DATE_PRESETS.find((preset) => filters.to === null && filters.from === presetFrom(preset.days));
  const isCustom = customOpen || (activePreset === undefined && (filters.from !== null || filters.to !== null));

  function applyPreset(days: number | null) {
    const params = new URLSearchParams(window.location.search);
    const from = presetFrom(days);
    if (from === null) params.delete("from");
    else params.set("from", from);
    params.delete("to");
    const query = params.toString();
    setCustomOpen(false);
    window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
  }

  const isSelected = (preset: (typeof DATE_PRESETS)[number]) =>
    !isCustom && (activePreset === preset || (activePreset === undefined && preset.days === null));

  const chip = (selected: boolean) =>
    cn(
      "h-9 rounded-md border px-2.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      selected ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
    );

  return (
    <div role="group" aria-label="Date range" className="flex flex-wrap items-center gap-1.5">
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          aria-pressed={isSelected(preset)}
          onClick={() => applyPreset(preset.days)}
          className={chip(isSelected(preset))}
        >
          {preset.label}
        </button>
      ))}
      <button type="button" aria-pressed={isCustom} onClick={() => setCustomOpen(true)} className={chip(isCustom)}>
        Custom
      </button>
      {isCustom ? (
      <label className={cn(CONTROL_SHELL_CLASS, "gap-2")}>
        <CalendarRange className="size-3.5 shrink-0" />
        <span className="sr-only">From date</span>
        <input
          type="date"
          aria-label="From date"
          value={filters.from ?? ""}
          max={filters.to ?? undefined}
          onChange={(event) => setFilter("from", event.target.value === "" ? null : event.target.value)}
          className="w-[112px] appearance-none bg-transparent font-mono text-[11px] tabular-nums text-foreground outline-none [&::-webkit-calendar-picker-indicator]:opacity-60"
        />
        <span aria-hidden className="text-muted-foreground/60">
          –
        </span>
        <span className="sr-only">To date</span>
        <input
          type="date"
          aria-label="To date"
          value={filters.to ?? ""}
          min={filters.from ?? undefined}
          onChange={(event) => setFilter("to", event.target.value === "" ? null : event.target.value)}
          className="w-[112px] appearance-none bg-transparent font-mono text-[11px] tabular-nums text-foreground outline-none [&::-webkit-calendar-picker-indicator]:opacity-60"
        />
      </label>
      ) : null}
    </div>
  );
}
