"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BrandForm } from "@/components/drishti/brands/BrandForm";
import { BrandList } from "@/components/drishti/brands/BrandList";
import { splitOwnBrand } from "@/components/drishti/brands/brand-model";
import { useCreateBrand } from "@/components/drishti/brands/useCreateBrand";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function BrandsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-border pb-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="type-display text-fg">Brands</h1>
            <p className="mt-2 max-w-[62ch] text-sm leading-6 text-muted-foreground">
              Your live index of tracked rivals. Open a profile to inspect the evidence behind each signal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild className="w-fit gap-2">
              <Link href="/brands?add=1">
                <Plus className="size-4" aria-hidden />
                Add brand
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-fit gap-2">
              <Link href="/onboarding">
                <Compass className="size-4" aria-hidden />
                Set up your brand
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <QueryBoundary label="The brands list">
        <Suspense fallback={null}>
          <BrandsBody />
        </Suspense>
      </QueryBoundary>
    </div>
  );
}

function BrandsBody() {
  const brands = useQuery(api.brands.listBrands);
  const { submit, isSaving, error, success } = useCreateBrand();
  const [tracking, setTracking] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const formOpen = tracking || searchParams.get("add") === "1";
  const list = useMemo(() => brands ?? [], [brands]);
  const isLoading = brands === undefined;
  const { own, competitors } = useMemo(() => splitOwnBrand(list), [list]);
  const trackedCount = own ? competitors.length : list.length;
  return (
    <div className="grid gap-8">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="type-headline text-fg">Tracked brands</h2>
            <p className="mt-1 text-xs text-muted-foreground">Search presence, creative signals and demand context.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {isLoading ? "Loading" : `${trackedCount} tracked`}
            </span>
          </div>
        </div>
        <BrandList
          brands={list}
          isLoading={isLoading}
          emptyAction={
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/onboarding">
                  <Compass className="size-3.5" aria-hidden />
                  Set up your brand
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTracking(true)} className="gap-1.5">
                <Plus className="size-3.5" aria-hidden />
                Track one manually
              </Button>
            </div>
          }
        />
      </section>
      <Sheet
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            router.replace("/brands");
            setTracking(false);
          }
        }}
      >
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[420px]">
          <BrandForm existingBrands={list} onSubmit={submit} isSaving={isSaving} error={error} success={success} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
