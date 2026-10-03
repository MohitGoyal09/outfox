"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_BRAND_FILTERS, filtersToParams, parseBrandFilters, type BrandFilters } from "./filters-model";

export function useBrandFilters(): {
  filters: BrandFilters;
  setFilter: <K extends keyof BrandFilters>(key: K, value: BrandFilters[K]) => void;
  resetFilters: () => void;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(() => parseBrandFilters(searchParams), [searchParams]);

  const push = useCallback(
    (next: BrandFilters) => {
      const params = filtersToParams(next, searchParams);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setFilter = useCallback(
    <K extends keyof BrandFilters>(key: K, value: BrandFilters[K]) => push({ ...filters, [key]: value }),
    [filters, push],
  );

  const resetFilters = useCallback(() => push({ ...DEFAULT_BRAND_FILTERS, view: filters.view }), [filters.view, push]);

  return { filters, setFilter, resetFilters };
}
