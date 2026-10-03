"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_FEED_FILTERS, feedFiltersToParams, parseFeedFilters, type FeedFilters } from "./feed-model";

export function useFeedFilters(): {
  filters: FeedFilters;
  setFilter: <K extends keyof FeedFilters>(key: K, value: FeedFilters[K]) => void;
  resetFilters: () => void;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(() => parseFeedFilters(searchParams), [searchParams]);

  const push = useCallback(
    (next: FeedFilters) => {
      const params = feedFiltersToParams(next, searchParams);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setFilter = useCallback(
    <K extends keyof FeedFilters>(key: K, value: FeedFilters[K]) => push({ ...filters, [key]: value }),
    [filters, push],
  );

  const resetFilters = useCallback(() => push({ ...DEFAULT_FEED_FILTERS, offtopic: filters.offtopic }), [filters.offtopic, push]);

  return { filters, setFilter, resetFilters };
}
