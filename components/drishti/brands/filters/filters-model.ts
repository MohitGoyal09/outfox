
import { FUNNEL_STAGES, HOOK_TYPES } from "../../tokens";
import { hookName, sourceName, stageName } from "@/components/drishti/labels";
import { FETCH_ENGINES, type ClaimDoc } from "../brand-model";

export type FreshnessValue = "all" | "24h" | "7d" | "30d" | "90d";
export type SortValue = "newest" | "oldest" | "confidence" | "highest_rank" | "most_views" | "most_likes" | "longest_run";

export type BrandFilters = {
  engine: string;
  hook: string;
  funnel: string;
  freshness: FreshnessValue;
  sort: SortValue;
  from: string | null;
  to: string | null;
};

export const DEFAULT_BRAND_FILTERS: BrandFilters = {
  engine: "all",
  hook: "all",
  funnel: "all",
  freshness: "all",
  sort: "newest",
  from: null,
  to: null,
};

const FRESHNESS_VALUES: readonly FreshnessValue[] = ["all", "24h", "7d", "30d", "90d"];
const SORT_VALUES: readonly SortValue[] = [
  "newest",
  "oldest",
  "confidence",
  "highest_rank",
  "most_views",
  "most_likes",
  "longest_run",
];

export const SORT_LABEL: Record<SortValue, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  confidence: "Highest confidence",
  highest_rank: "Highest rank",
  most_views: "Most views",
  most_likes: "Most likes",
  longest_run: "Longest run",
};

export function parseBrandFilters(params: URLSearchParams): BrandFilters {
  const engine = params.get("engine") ?? DEFAULT_BRAND_FILTERS.engine;
  const hook = params.get("hook") ?? DEFAULT_BRAND_FILTERS.hook;
  const funnel = params.get("funnel") ?? DEFAULT_BRAND_FILTERS.funnel;
  const freshnessRaw = params.get("freshness");
  const freshness = FRESHNESS_VALUES.includes(freshnessRaw as FreshnessValue)
    ? (freshnessRaw as FreshnessValue)
    : DEFAULT_BRAND_FILTERS.freshness;
  const sortRaw = params.get("sort");
  const to = params.get("to");
  return {
    engine,
    hook,
    funnel,
    freshness,
    sort,
    from: from !== null && isDateString(from) ? from : null,
    to: to !== null && isDateString(to) ? to : null,
  };
}

export function matchesBrandFilters(
  claim: ClaimDoc,
  tagsForClaim: ClaimDoc[],
  filters: BrandFilters,
  now: number,
): boolean {
  if (filters.engine !== "all" && claim.sourceEngine !== filters.engine) return false;
  if (!withinDateRange(claim.fetchedAt, filters.from, filters.to)) return false;
  return true;
}

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

export function sortClaims<T extends Pick<ClaimDoc, "fetchedAt" | "confidence">>(
  claims: T[],
  sort: SortValue,
): T[] {
  const sorted = [...claims];
  if (sort === "confidence") {
    return sorted.sort((a, b) => {
      return delta !== 0 ? delta : a.fetchedAt < b.fetchedAt ? 1 : -1;
    });
  }
  return sorted.sort((a, b) => (a.fetchedAt < b.fetchedAt ? 1 : -1));
}

export type FilterOption = { value: string; label: string };

export function engineOptionsFrom(claims: ClaimDoc[]): FilterOption[] {
  const present = new Set(claims.map((claim) => claim.sourceEngine));
  return FETCH_ENGINES.filter((engine) => present.has(engine)).map((engine) => ({
    value: engine,
    label: sourceName(engine),
  }));
}

function realTagOptionsFrom(tags: ClaimDoc[], values: readonly string[], pick: (tag: ClaimDoc) => string | undefined, labelFor: (value: string) => string): FilterOption[] {
  const present = new Set(tags.map(pick).filter((value): value is string => value !== undefined && value !== "not_applicable"));
  return values.filter((value) => present.has(value)).map((value) => ({ value, label: labelFor(value) }));
}

export function hookOptionsFrom(tags: ClaimDoc[]): FilterOption[] {
  return realTagOptionsFrom(tags, HOOK_TYPES, (tag) => tag.hookType, hookName);
}

export const SORT_OPTIONS: FilterOption[] = [
  { value: "newest", label: SORT_LABEL.newest },
  { value: "oldest", label: SORT_LABEL.oldest },
  { value: "confidence", label: SORT_LABEL.confidence },
];
