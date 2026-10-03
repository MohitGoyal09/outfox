
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
  view: "cards" | "table";
  offtopic: "hide" | "show";
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

export function filtersToParams(filters: BrandFilters, base: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(base);
  const write = (key: string, value: string | null, isDefault: boolean) => {
    if (value === null || isDefault) next.delete(key);
    else next.set(key, value);
  };
  write("engine", filters.engine, filters.engine === DEFAULT_BRAND_FILTERS.engine);
  write("freshness", filters.freshness, filters.freshness === DEFAULT_BRAND_FILTERS.freshness);
  write("sort", filters.sort, filters.sort === DEFAULT_BRAND_FILTERS.sort);
  write("view", filters.view, filters.view === DEFAULT_BRAND_FILTERS.view);
  write("offtopic", filters.offtopic, filters.offtopic === DEFAULT_BRAND_FILTERS.offtopic);
  return next;
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


const SENTENCE_FRESHNESS_LABEL: Record<Exclude<FreshnessValue, "all">, string> = {
  "24h": "the last 24 hours",
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  "90d": "the last 90 days",
};
