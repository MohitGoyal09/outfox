"use client";

import Link from "next/link";
import { ArrowUpRight, CircleCheck, Clock3, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BrandDoc, FetchEngine } from "./brand-model";
import { formatStamp, profileStatusLabel } from "../cohorts/cohorts-model";
import {
  FETCH_ENGINES,
  enginesWithEvidence,
  evidenceSummaryByBrandId,
  latestRunByBrand,
  splitOwnBrand,
} from "./brand-model";
import { sourceName } from "@/components/drishti/labels";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { SkeletonRows } from "../Skeleton";
import { iconProps } from "../tokens";
import { BrandMark } from "./BrandMark";
import { OwnBrandToggle } from "./OwnBrandToggle";

export type BrandListProps = {
  brands: BrandDoc[];
  isLoading?: boolean;
  emptyAction?: React.ReactNode;
  className?: string;
};

function StatusBadge({ status }: { status: string }) {
  const ready = status === "ready";
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1.5 rounded-full px-2.5 text-[11px] font-medium",
        ready ? "border-ok/30 bg-ok/10 text-ok" : "border-warn/30 bg-warn/10 text-warn",
      )}
    >
      {ready ? <CircleCheck className="size-3" /> : <Clock3 className="size-3" />}
      {profileStatusLabel(status)}
    </Badge>
  );
}

type BrandRowProps = {
  brand: BrandDoc;
  own?: boolean;
  claimCount: number | undefined;
  latestRunAt: string | undefined;
  engines: Set<FetchEngine>;
};

function BrandRow({ brand, own = false, claimCount, latestRunAt, engines }: BrandRowProps) {
  return (
    <Panel
      interactive
      className={cn("group overflow-hidden", own && "border-accent/35 bg-accent/[0.03]")}
      ariaLabel={brand.name}
    >
      <Link
        href={`/brands/${brand._id}`}
        className="block"
      >
        <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.9fr)_auto] sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark name={brand.name} domain={brand.domain} className="size-11 rounded-xl" />
            <div className="min-w-0">
              {own ? (
                <p className={cn("font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg")}>
                  Your brand
                </p>
              ) : null}
              <div className="flex items-center gap-2">
                <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-fg">{brand.name}</h3>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{brand.domain} · {brand.vertical}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs sm:grid-cols-1">
            <span className="text-muted-foreground">
              Evidence{" "}
              <strong className="font-mono font-medium tabular-nums text-fg">{claimCount ?? "—"}</strong>
            </span>
            <span className="text-muted-foreground">
              Latest{" "}
              <strong className="font-mono font-medium tabular-nums text-fg">
                {latestRunAt ? formatStamp(latestRunAt).split(" · ")[0] : "Not checked yet"}
              </strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <StatusBadge status={brand.profileStatus} />
            <span className="hidden font-mono text-[10px] tabular-nums text-muted-foreground lg:inline">
              {brand.lastRefreshedAt ? formatStamp(brand.lastRefreshedAt).split(" · ")[0] : "never refreshed"}
            </span>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-1 border-t border-border px-5 py-2.5 text-[10px] text-muted-foreground">
        <span className="mr-2 uppercase tracking-[0.14em]">Evidence from</span>
        {FETCH_ENGINES.map((engine) => {
          const on = engines.has(engine);
          return (
            <span
              key={engine}
              title={`${sourceName(engine)}: ${on ? "evidence found" : "no evidence found"}`}
              className={cn("size-1.5 rounded-full", on ? "bg-ok" : "bg-border-strong")}
            />
          );
        })}
        <span className="sr-only">
          {FETCH_ENGINES.map(
            (engine) => `${sourceName(engine)}: ${engines.has(engine) ? "evidence found" : "no evidence found"}`,
          ).join("; ")}
        </span>
        <span className="ml-auto mr-2 font-mono tabular-nums">
          {brand.createdAt ? `Added ${formatStamp(brand.createdAt).split(" · ")[0]}` : ""}
        </span>
        <OwnBrandToggle brandId={brand._id} isOwn={own} size="xs" />
      </div>
    </Panel>
  );
}

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
    latestRunAt: latestRunMap.get(String(brand._id))?.requestedAt,
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
        <SkeletonRows count={3} variant="row" height={104} />
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
