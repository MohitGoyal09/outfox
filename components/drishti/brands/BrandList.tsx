"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BrandDoc } from "./brand-model";
import {
  enginesWithEvidence,
  latestCheckAt,
  evidenceSummaryByBrandId,
  latestRunByBrand,
  splitOwnBrand,
} from "./brand-model";
import { EmptyState } from "../EmptyState";
import { SkeletonRows } from "../Skeleton";
import { iconProps } from "../tokens";
import { BrandRow } from "./BrandRow";

export type BrandListProps = {
  brands: BrandDoc[];
  isLoading?: boolean;
  emptyAction?: React.ReactNode;
  className?: string;
};

export function BrandList({ brands, isLoading = false, emptyAction, className }: BrandListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "ready" | "pending">("all");
  const { own, competitors } = useMemo(() => splitOwnBrand(brands), [brands]);
  const brandIds = useMemo(() => brands.map((brand) => brand._id), [brands]);
  const runs = useQuery(api.runs.listByStatus, { status: "complete" });
  const evidenceSummary = useQuery(api.claims.evidenceSummaryByBrands, { brandIds });
  const latestRunMap = useMemo(() => latestRunByBrand(runs ?? []), [runs]);
  const evidenceMap = useMemo(
    () => (evidenceSummary === undefined ? undefined : evidenceSummaryByBrandId(evidenceSummary)),
    [evidenceSummary],
  );
  const rowProps = (brand: BrandDoc) => ({
    claimCount: evidenceMap?.get(String(brand._id))?.evidenceCount,
    latestCheckAt: latestCheckAt(evidenceMap?.get(String(brand._id)), latestRunMap.get(String(brand._id))),
    engines: enginesWithEvidence(evidenceMap?.get(String(brand._id))),
  });
  const filtered = useMemo(
    () =>
      competitors.filter((brand) => {
        const matchesQuery = `${brand.name} ${brand.domain} ${brand.vertical}`.toLowerCase().includes(query.toLowerCase());
        const matchesFilter =
          filter === "all" ||
          (filter === "ready" ? brand.profileStatus === "ready" : brand.profileStatus !== "ready");
        return matchesQuery && matchesFilter;
      }),
    [competitors, filter, query],
  );

  if (isLoading) {
    return (
      <div className={cn("grid gap-3", className)}>
        <SkeletonRows count={3} variant="row" height={72} />
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <EmptyState
        bounded
        icon={<Search {...iconProps} size={16} />}
        title="No brands tracked yet."
        description="Add your first rival to start collecting search, video and trend evidence against it."
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {own ? <BrandRow brand={own} own {...rowProps(own)} /> : null}
      {competitors.length === 0 ? (
        <EmptyState
          bounded
          icon={<Search {...iconProps} size={16} />}
          title="No rivals tracked yet."
          description={`${own?.name} is tracked as your brand. Add a rival to start comparing search, video and trend evidence against it.`}
          action={emptyAction}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tracked brands"
                className="h-10 pl-9"
                aria-label="Search tracked brands"
              />
            </div>
            <div className="flex items-center gap-1 rounded-sm border border-border bg-bg-raised p-1">
              <SlidersHorizontal className="mx-2 size-3.5 text-muted-foreground" aria-hidden />
              {(["all", "ready", "pending"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={filter === value ? "secondary" : "ghost"}
                  className="h-7 rounded-sm px-2.5 text-xs capitalize"
                  onClick={() => setFilter(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filtered.length} of {competitors.length} tracked {competitors.length === 1 ? "brand" : "brands"}
            </span>
            <span className="font-mono">Sorted by recently added</span>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              size="sm"
              bounded
              icon={<Search {...iconProps} size={16} />}
              title="No tracked brand matches this search."
              description={`No brand in your list matches “${query}”. Clear the search or switch the status filter to see more.`}
            />
          ) : (
            <div className="grid gap-3">
              {filtered.map((brand) => (
                <BrandRow key={String(brand._id)} brand={brand} {...rowProps(brand)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
