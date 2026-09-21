"use client";

import { useState } from "react";
import { ArrowRight, Info, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrandForm, type BrandCreatePath, type BrandFormValues } from "../brands/BrandForm";
import { CohortPicker } from "./CohortPicker";
import { MAX_RIVALS_PER_COHORT, cohortBoundText, selectionReason, type BrandDoc } from "./cohorts-model";

export type CohortComposerProps = { brands: BrandDoc[]; isLoadingBrands: boolean; brandsError?: string | null; onRetryBrands?: () => void; selectedIds: string[]; onChangeSelected: (ids: string[]) => void; editingKey?: string | null; onCreateBrand: (values: BrandFormValues, path: BrandCreatePath) => Promise<boolean>; isSavingBrand: boolean; createError?: string | null; createSuccess?: string | null; onOpenCohort: () => void; onReset: () => void; className?: string };

export function CohortComposer({ brands, isLoadingBrands, brandsError = null, onRetryBrands, selectedIds, onChangeSelected, editingKey = null, onCreateBrand, isSavingBrand, createError = null, createSuccess = null, onOpenCohort, onReset, className }: CohortComposerProps) {
  const [adding, setAdding] = useState(false);
  const reason = selectionReason(selectedIds.length);
  const bound = cohortBoundText(selectedIds.length, MAX_RIVALS_PER_COHORT);
  return <Card id="cohort-composer" className={cn("border-border bg-card", className)}>
    <CardHeader className="p-5 pb-4"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Users className="size-4" aria-hidden="true" /></span><div><CardTitle className="text-base font-medium">{editingKey === null ? "Build a cohort" : "Edit rivals"}</CardTitle><CardDescription className="mt-1 max-w-[48ch] leading-5">Choose up to {MAX_RIVALS_PER_COHORT} brands. Drishti keeps every result tied to this exact set.</CardDescription></div></div><Button variant="outline" size="sm" onClick={() => setAdding((value) => !value)} aria-expanded={adding}><Plus className="size-3.5" aria-hidden="true" />{adding ? "Hide form" : "Add brand"}</Button></div></CardHeader>
    <CardContent className="space-y-5 p-5 pt-0">
      {adding ? <div className="rounded-lg border border-border bg-muted/30 p-4"><BrandForm existingBrands={brands} onSubmit={onCreateBrand} isSaving={isSavingBrand} error={createError} success={createSuccess} framed={false} /></div> : null}
      <CohortPicker brands={brands} selectedIds={selectedIds} maxBrands={MAX_RIVALS_PER_COHORT} onChange={onChangeSelected} isLoading={isLoadingBrands} error={brandsError} {...(onRetryBrands ? { onRetry: onRetryBrands } : {})} emptyAction={<Button variant="outline" size="sm" onClick={() => setAdding(true)}><Plus className="size-3.5" aria-hidden="true" /> Add first brand</Button>} />
      <Alert className="border-border bg-muted/30"><Info className="size-4" aria-hidden="true" /><AlertTitle className="text-sm">Cached first, live when approved</AlertTitle><AlertDescription>Opening a cohort uses its latest stored evidence. A live refresh is only run after you approve it on the comparison page.</AlertDescription></Alert>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div><span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Selection</span><p className="mt-1 font-mono text-sm tabular-nums text-foreground">{bound}</p></div><div className="flex flex-wrap items-center gap-2"><Button variant="ghost" size="sm" onClick={onReset} disabled={selectedIds.length === 0}>Clear</Button><Button size="sm" onClick={onOpenCohort} disabled={reason !== null} title={reason ?? undefined}>Open comparison <ArrowRight className="size-3.5" aria-hidden="true" /></Button></div></div>{reason !== null ? <p className="text-xs text-muted-foreground">{reason}</p> : null}
    </CardContent>
  </Card>;
}
