"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BrandForm } from "@/components/drishti/brands/BrandForm";
import { BrandList } from "@/components/drishti/brands/BrandList";
import { useCreateBrand } from "@/components/drishti/brands/useCreateBrand";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function BrandsPage() {
  return <div className="flex flex-col gap-8"><header className="flex flex-col gap-3 border-b border-border pb-7"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-accent"><Search className="size-3.5" />Research index</div><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Brands</h1><p className="mt-2 max-w-[62ch] text-sm leading-6 text-muted-foreground">Your live index of tracked rivals. Open a profile to inspect the evidence behind each signal.</p></div><Button onClick={() => document.getElementById("brand-form")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="w-fit gap-2"><Plus className="size-4" />Track a brand</Button></div></header><QueryBoundary label="The brands list"><BrandsBody /></QueryBoundary></div>;
}

function BrandsBody() {
  const brands = useQuery(api.brands.listBrands);
  const { submit, isSaving, error, success } = useCreateBrand();
  const [tracking, setTracking] = useState(false);
  const list = useMemo(() => brands ?? [], [brands]);
  const isLoading = brands === undefined;
  return <div className="grid gap-8 min-[1000px]:grid-cols-[minmax(0,1fr)_340px] min-[1000px]:items-start"><section className="flex min-w-0 flex-col gap-4"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-semibold tracking-[-0.025em] text-foreground">Tracked brands</h2><p className="mt-1 text-xs text-muted-foreground">Search presence, creative signals and demand context.</p></div><div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{isLoading ? "Loading" : `${list.length} tracked`}</span><Button variant="outline" size="sm" onClick={() => setTracking((value) => !value)} className="gap-1.5"><Plus className="size-3.5" />{tracking ? "Hide form" : "Add brand"}</Button></div></div><BrandList brands={list} isLoading={isLoading} emptyAction={<Button variant="outline" size="sm" onClick={() => setTracking(true)} className="gap-1.5"><Plus className="size-3.5" />Track the first brand</Button>} /></section><aside id="brand-form" className="min-w-0 min-[1000px]:sticky min-[1000px]:top-24">{tracking ? <BrandForm existingBrands={list} onSubmit={submit} isSaving={isSaving} error={error} success={success} /> : <Card className="border-dashed bg-card shadow-none"><CardContent className="flex flex-col items-start gap-3 p-5"><h3 className="text-sm font-semibold text-foreground">Track a brand</h3><p className="text-xs leading-5 text-muted-foreground">Add a rival by URL, handle, or name. It becomes available to every cohort you build.</p><Button variant="outline" size="sm" onClick={() => setTracking(true)} className="gap-1.5"><Plus className="size-3.5" />Open the form <ArrowUpRight className="size-3.5" /></Button></CardContent></Card>}</aside></div>;
}
