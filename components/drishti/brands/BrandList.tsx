"use client";

import Link from "next/link";
import { ArrowUpRight, CircleCheck, Clock3, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { BrandDoc } from "./brand-model";
import { formatStamp, profileStatusLabel } from "../cohorts/cohorts-model";
import { FETCH_ENGINES, splitOwnBrand } from "./brand-model";
import { sourceName } from "@/components/drishti/labels";
import { BrandMark } from "./BrandMark";
import { OwnBrandToggle } from "./OwnBrandToggle";

export type BrandListProps = {
  brands: BrandDoc[];
  isLoading?: boolean;
  emptyAction?: React.ReactNode;
  className?: string;
};

function BrandRow({ brand, own = false }: { brand: BrandDoc; own?: boolean }) {
  const claims = useQuery(api.claims.byBrand, { brandId: brand._id });
  const runs = useQuery(api.runs.listByStatus, { status: "complete" });
  const latestRun = runs?.find((run) => run.brandIds.some((id) => String(id) === String(brand._id)));
  const claimCount = claims?.filter((claim) => claim.sourceEngine !== "llm_tag").length;

  return (
    <Card className={cn("group overflow-hidden border-border/80 bg-card py-0 shadow-none transition-colors hover:border-accent/40 hover:bg-accent/[0.025]", own && "border-accent/35 bg-accent/[0.03] hover:border-accent/50 hover:bg-accent/[0.05]")}>
      <Link href={`/brands/${brand._id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.9fr)_auto] sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark name={brand.name} domain={brand.domain} className="size-11 rounded-xl" />
            <div className="min-w-0">
              {own ? <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Your brand</p> : null}
              <div className="flex items-center gap-2"><h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-foreground">{brand.name}</h3><ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{brand.domain} · {brand.vertical}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs sm:grid-cols-1"><span className="text-muted-foreground">Evidence <strong className="font-mono font-medium text-foreground">{claimCount ?? "—"}</strong></span><span className="text-muted-foreground">Latest <strong className="font-mono font-medium text-foreground">{latestRun ? formatStamp(latestRun.requestedAt).split(" · ")[0] : "Not checked yet"}</strong></span></div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end"><Badge variant={brand.profileStatus === "ready" ? "secondary" : "outline"} className={cn("gap-1.5 rounded-full px-2.5 font-medium", brand.profileStatus === "ready" && "bg-emerald-50 text-emerald-700 hover:bg-emerald-50")}>{brand.profileStatus === "ready" ? <CircleCheck className="size-3" /> : <Clock3 className="size-3" />}{profileStatusLabel(brand.profileStatus)}</Badge><span className="hidden font-mono text-[10px] text-muted-foreground lg:inline">{brand.lastRefreshedAt ? formatStamp(brand.lastRefreshedAt).split(" · ")[0] : "never refreshed"}</span></div>
        </CardContent>
      </Link>
      <div className="flex items-center gap-1 border-t border-border/70 px-5 py-2.5 text-[10px] text-muted-foreground"><span className="mr-2 uppercase tracking-[0.14em]">Checked</span>{FETCH_ENGINES.map((engine) => <span key={engine} title={sourceName(engine)} className={cn("size-1.5 rounded-full", latestRun ? "bg-emerald-500" : "bg-muted-foreground/30")} />)}<span className="ml-auto mr-2 font-mono">{brand.createdAt ? `Added ${formatStamp(brand.createdAt).split(" · ")[0]}` : ""}</span><OwnBrandToggle brandId={brand._id} isOwn={own} size="xs" /></div>
    </Card>
  );
}

export function BrandList({ brands, isLoading = false, emptyAction, className }: BrandListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "ready" | "pending">("all");
  const { own, competitors } = useMemo(() => splitOwnBrand(brands), [brands]);
  const filtered = useMemo(() => competitors.filter((brand) => { const matchesQuery = `${brand.name} ${brand.domain} ${brand.vertical}`.toLowerCase().includes(query.toLowerCase()); const matchesFilter = filter === "all" || (filter === "ready" ? brand.profileStatus === "ready" : brand.profileStatus !== "ready"); return matchesQuery && matchesFilter; }), [competitors, filter, query]);
  if (isLoading) return <div className={cn("grid gap-3", className)}>{[1, 2, 3].map((item) => <Skeleton key={item} className="h-28 rounded-xl" />)}</div>;
  if (brands.length === 0) return <Card className="border-dashed shadow-none"><CardContent className="flex flex-col items-start gap-3 p-8"><h3 className="font-semibold">No brands tracked yet</h3><p className="max-w-md text-sm text-muted-foreground">Add your first rival to start collecting search, video and trend evidence.</p>{emptyAction}</CardContent></Card>;
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {own ? <BrandRow brand={own} own /> : null}
      {competitors.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-start gap-3 p-8">
            <h3 className="font-semibold">No rivals tracked yet</h3>
            <p className="max-w-md text-sm text-muted-foreground">{own?.name} is tracked as your brand. Add a rival to start comparing search, video and trend evidence against it.</p>
            {emptyAction}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tracked brands" className="h-10 pl-9" aria-label="Search tracked brands" /></div><div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1"><SlidersHorizontal className="mx-2 size-3.5 text-muted-foreground" />{(["all", "ready", "pending"] as const).map((value) => <Button key={value} type="button" size="sm" variant={filter === value ? "secondary" : "ghost"} className="h-7 rounded-md px-2.5 text-xs capitalize" onClick={() => setFilter(value)}>{value}</Button>)}</div></div>
          <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{filtered.length} of {competitors.length} tracked {competitors.length === 1 ? "brand" : "brands"}</span><span className="font-mono">Sorted by recently added</span></div>
          {filtered.length === 0 ? <Card className="border-dashed shadow-none"><CardContent className="p-8 text-sm text-muted-foreground">No tracked brand matches “{query}”.</CardContent></Card> : <div className="grid gap-3">{filtered.map((brand) => <BrandRow key={String(brand._id)} brand={brand} />)}</div>}
        </div>
      )}
    </div>
  );
}
