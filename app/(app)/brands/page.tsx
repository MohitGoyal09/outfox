"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BrandList } from "@/components/drishti/brands/BrandList";
import { splitOwnBrand } from "@/components/drishti/brands/brand-model";
import { useAddBrandHref } from "@/components/drishti/brands/useAddBrandHref";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import { PageHeader } from "@/components/drishti/PageHeader";
import { pillClasses } from "@/components/drishti/PillButton";
import { SkeletonRows } from "@/components/drishti/Skeleton";

export default function BrandsPage() {
  return (
    <QueryBoundary label="The brands list">
      <Suspense fallback={<SkeletonRows count={5} height={56} />}>
        <BrandsBody />
      </Suspense>
    </QueryBoundary>
  );
}

function BrandsBody() {
  const brands = useQuery(api.brands.listBrands);
  const addBrandHref = useAddBrandHref();
  const list = useMemo(() => brands ?? [], [brands]);
  const isLoading = brands === undefined;
  const { own, competitors } = useMemo(() => splitOwnBrand(list), [list]);
  const trackedCount = own ? competitors.length : list.length;
  const emptyAction = (
    <>
      <Link href="/onboarding" className={pillClasses("ink", "sm")}>
        Set up your brand
      </Link>
      <Link href={addBrandHref} scroll={false} className={pillClasses("outline", "sm")}>
        Track one manually
      </Link>
    </>
  );
  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={isLoading ? "Brands" : `Brands · ${trackedCount} tracked`}
        title="Brands"
        sub="Your live index of tracked rivals. Open a profile to inspect the evidence behind each signal."
        actions={
          <>
            <Link href="/onboarding" className={pillClasses("outline")}>
              {own ? "Change your brand" : "Set up your brand"}
            </Link>
            <Link href={addBrandHref} scroll={false} className={pillClasses("ink")}>
              Add brand
            </Link>
          </>
        }
      />
      <BrandList brands={list} isLoading={isLoading} emptyAction={emptyAction} />
    </div>
  );
}
