"use client";


import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { BrandForm } from "@/components/drishti/brands/BrandForm";
import { BrandList } from "@/components/drishti/brands/BrandList";
import { useCreateBrand } from "@/components/drishti/brands/useCreateBrand";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import { Button } from "@/components/drishti/Button";
import { VALUE_CLASS, iconProps } from "@/components/drishti/tokens";
import { cn } from "@/lib/utils";

export default function BrandsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="type-display text-[var(--text-primary,#eeeef2)]">Brands</h1>
        <p className="max-w-[68ch] text-[14px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
          A brand is a rival you track. Its profile collects every run that
          fetched it, so the drift between runs stays legible.
        </p>
      </header>

      <QueryBoundary label="The brands list">
        <BrandsBody />
      </QueryBoundary>
    </div>
  );
}

function BrandsBody() {
  const brands = useQuery(api.brands.listBrands);
  const { submit, isSaving, error, success, reset } = useCreateBrand();
  const [tracking, setTracking] = useState(false);

  const list = useMemo(() => brands ?? [], [brands]);
  const isLoading = brands === undefined;

  function toggleTracking() {
    setTracking((value) => !value);
    reset();
  }

  return (
    <div className="grid gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_400px] min-[900px]:items-start">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-[1.05rem] font-medium leading-[1.32] text-[var(--text-primary,#eeeef2)]">
            Tracked brands
          </h2>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {!isLoading ? (
              <span className={cn(VALUE_CLASS, "text-[11.5px] text-[var(--text-tertiary,#64646f)]")}>
                {list.length} {list.length === 1 ? "brand" : "brands"}
              </span>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTracking}
              aria-expanded={tracking}
              icon={<Plus {...iconProps} size={14} />}
            >
              {tracking ? "Hide form" : "Track a brand"}
            </Button>
          </span>
        </div>

        <BrandList
          brands={list}
          isLoading={isLoading}
          emptyAction={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTracking(true)}
              icon={<Plus {...iconProps} size={14} />}
            >
              Track the first brand
            </Button>
          }
        />
      </section>

      <aside
        id="brand-form"
        className="min-w-0 min-[900px]:sticky min-[900px]:top-36"
      >
        {tracking ? (
          <BrandForm
            existingBrands={list}
            onSubmit={submit}
            isSaving={isSaving}
            error={error}
            success={success}
          />
        ) : (
          <section
            aria-label="Track a brand"
            className="flex flex-col items-start gap-3 rounded-[10px] border border-dashed border-[var(--border,#24242f)] bg-[var(--bg-inset,#0e0e13)] p-4"
          >
            <h3 className="text-[1.05rem] font-semibold leading-[1.32] text-[var(--text-primary,#eeeef2)]">
              Track a brand
            </h3>
            <p className="max-w-[56ch] text-[13px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
              Add a rival by URL, handle, or name. It becomes available to every
              cohort you build.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTracking(true)}
              icon={<Plus {...iconProps} size={14} />}
            >
              Open the form
            </Button>
          </section>
        )}
      </aside>
    </div>
  );
}
