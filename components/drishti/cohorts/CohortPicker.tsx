"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { Check, CircleAlert, RefreshCw, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { capReason, cohortBoundText, profileStatusLabel, profileStatusTone, type BrandDoc } from "./cohorts-model";

export type CohortPickerProps = { brands: BrandDoc[]; selectedIds: string[]; maxBrands: number; onChange: (selectedIds: string[]) => void; isLoading?: boolean; error?: string | null; onRetry?: () => void; emptyAction?: ReactNode; className?: string };
export type PickerRowState = { selected: boolean; atCap: boolean; selectable: boolean };

export function pickerRowState(input: { id: string; selectedIds: string[]; maxBrands: number; isLoading?: boolean }): PickerRowState {
  const selected = input.selectedIds.includes(input.id);
  const atCap = input.selectedIds.length >= input.maxBrands;
  return { selected, atCap, selectable: !input.isLoading && (selected || !atCap) };
}

export function CohortPicker({ brands, selectedIds, maxBrands, onChange, isLoading = false, error = null, onRetry, emptyAction, className }: CohortPickerProps) {
  const [query, setQuery] = React.useState("");
  const bound = cohortBoundText(selectedIds.length, maxBrands);
  const atCap = selectedIds.length >= maxBrands;
  const filtered = brands.filter((brand) => `${brand.name} ${brand.domain} ${brand.vertical}`.toLowerCase().includes(query.trim().toLowerCase()));
  function toggle(id: string) {
    const state = pickerRowState({ id, selectedIds, maxBrands, isLoading });
    if (!state.selectable) return;
    onChange(state.selected ? selectedIds.filter((selected) => selected !== id) : [...selectedIds, id]);
  }
  return <div className={cn("space-y-3", className)}>
    <div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="font-heading text-sm font-medium text-foreground">Choose rivals</h3><p className="mt-1 text-xs text-muted-foreground">Select the brands this comparison should keep together.</p></div><Badge variant={atCap ? "secondary" : "outline"} className={cn("font-mono tabular-nums", atCap && "border-warn/30 bg-warn/10 text-warn")}>{bound}</Badge></div>
    {error !== null ? <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"><CircleAlert className="size-4" aria-hidden="true" /><span>{error}</span>{onRetry ? <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw className="size-3.5" aria-hidden="true" /> Retry</Button> : null}</div> : isLoading ? <div className="space-y-2" role="status" aria-label="Loading brands">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-[60px] w-full" />)}</div> : brands.length === 0 ? <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5"><div className="flex items-center gap-2 text-sm font-medium text-foreground"><Users className="size-4" aria-hidden="true" /> A cohort needs at least one rival.</div><p className="mt-1 text-sm leading-6 text-muted-foreground">Add a brand first, then return here to select it.</p>{emptyAction ? <div className="mt-3">{emptyAction}</div> : null}</div> : <div className="space-y-2">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter tracked brands" aria-label="Filter tracked brands" className="h-9 pl-9" /></div>
      <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1" aria-label="Tracked brands">{filtered.map((brand) => { const id = String(brand._id); const state = pickerRowState({ id, selectedIds, maxBrands, isLoading }); return <li key={id}><button type="button" role="checkbox" aria-checked={state.selected} disabled={!state.selectable} onClick={() => toggle(id)} className={cn("flex min-h-[60px] w-full items-center gap-3 rounded-lg border px-3 text-left", "transition-[background-color,border-color,transform] duration-150 ease-out", state.selected ? "border-accent bg-accent/10" : state.selectable ? "border-border bg-card hover:border-border-strong hover:bg-muted/40" : "cursor-not-allowed border-border bg-muted/30 opacity-55", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50") }><span aria-hidden="true" className={cn("flex size-4 shrink-0 items-center justify-center rounded-[4px] border", state.selected ? "border-accent bg-accent text-accent-foreground" : "border-border-strong bg-background")}>{state.selected ? <Check className="size-3" /> : null}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{brand.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{brand.domain} · {brand.vertical}</span></span><Badge variant="outline" className={cn("capitalize", profileStatusTone(brand.profileStatus) === "ok" && "border-ok/30 bg-ok/10 text-ok", profileStatusTone(brand.profileStatus) === "warn" && "border-warn/30 bg-warn/10 text-warn")}>{profileStatusLabel(brand.profileStatus)}</Badge></button></li>; })}</ul>
      {filtered.length === 0 ? <p className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">No tracked brand matches “{query}”.</p> : null}
      {atCap ? <p className="text-xs text-warn">{capReason(maxBrands)}</p> : null}
    </div>}
  </div>;
}
