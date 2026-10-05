"use client";

import { MetricInfo } from "../MetricInfo";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { BrandDoc } from "./brand-model";
import {
  enginesWithEvidence,
  latestCheckAt,
  evidenceSummaryByBrandId,
  latestRunByBrand,
  splitOwnBrand,
} from "./brand-model";
import { DataTable } from "../DataTable";
import { EmptyState } from "../EmptyState";
import { STATE_TRANSITION_CLASS } from "../tokens";
import { brandColumns, type BrandRowData } from "./BrandRow";

export type BrandListProps = {
  brands: BrandDoc[];
  isLoading?: boolean;
  emptyAction?: React.ReactNode;
  className?: string;
};

export function BrandList({ brands, isLoading = false, emptyAction, className }: BrandListProps) {
  const router = useRouter();
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
  const toRow = (brand: BrandDoc, isOwn = false): BrandRowData => ({
    brand,
    own: isOwn,
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

  const rows = useMemo(
    () => [...(own ? [toRow(own, true)] : []), ...filtered.map((brand) => toRow(brand))],
    [own, filtered, evidenceMap, latestRunMap],
  );

  if (!isLoading && brands.length === 0) {
    return (
      <EmptyState
        bounded
        title="No brands tracked yet."
        description="Add your first rival to start collecting search, video and trend evidence against it."
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {isLoading || competitors.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-tertiary" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tracked brands"
              className="h-10 rounded-full pl-9"
              aria-label="Search tracked brands"
              disabled={isLoading}
            />
          </div>
          <div role="group" aria-label="Filter by status" className="flex items-center gap-0.5 rounded-full bg-bg-inset p-[3px]">
            {(["all", "ready", "pending"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  "h-8 rounded-full px-3.5 text-[13px] font-medium capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  STATE_TRANSITION_CLASS,
                  filter === value ? "bg-accent text-accent-ink" : "text-fg-secondary hover:text-fg",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {!isLoading && competitors.length > 0 ? (
        <div className="flex items-center justify-between text-xs text-fg-secondary">
          <span className="font-mono tabular-nums">
            {filtered.length} of {competitors.length} {competitors.length === 1 ? "rival" : "rivals"}
          </span>
          <MetricInfo
            label="Stored findings"
            definition="Every finding we hold for this brand, across all checks. Signals counts only each brand's latest check."
          />
        </div>
      ) : null}
      <DataTable
        label="Tracked brands"
        columns={brandColumns}
        rows={rows}
        rowKey={(row) => String(row.brand._id)}
        loading={isLoading}
        onRowClick={(row) => router.push(`/brands/${row.brand._id}`)}
        empty={{
          size: "sm",
          title: "No tracked brand matches this search.",
          description: `No brand in your list matches “${query}”. Clear the search or switch the status filter to see more.`,
        }}
      />
      {!isLoading && own && competitors.length === 0 ? (
        <EmptyState
          bounded
          title="No rivals tracked yet."
          description={`${own.name} is tracked as your brand. Add a rival to start comparing search, video and trend evidence against it.`}
          action={emptyAction}
        />
      ) : null}
    </div>
  );
}
