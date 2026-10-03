
import { hookName, sourceName, stageName } from "@/components/drishti/labels";
import type { ClaimDoc, YoutubeVideoGroup } from "../brands/brand-model";
import { groupYoutubeVideoClaims, interleaveByEngine } from "../brands/brand-model";
import {
  DEFAULT_BRAND_FILTERS,
  filtersToParams,
  isDefaultBrandFilters,
  parseBrandFilters,
  type BrandFilters,
  type FilterOption,
  type SortValue,
} from "../brands/filters/filters-model";

export type FeedFilters = BrandFilters & { brand: string };

export const DEFAULT_FEED_FILTERS: FeedFilters = { ...DEFAULT_BRAND_FILTERS, brand: "all" };

export function feedFiltersToParams(filters: FeedFilters, base: URLSearchParams): URLSearchParams {
  if (filters.brand === DEFAULT_FEED_FILTERS.brand) next.delete("brand");
  else next.set("brand", filters.brand);
  return next;
}

export function isDefaultFeedFilters(filters: FeedFilters): boolean {
  return isDefaultBrandFilters(filters) && filters.brand === DEFAULT_FEED_FILTERS.brand;
}

export function brandOptionsFrom(
  claims: readonly ClaimDoc[],
  brands: readonly { _id: unknown; name: string }[],
): FilterOption[] {
  const present = new Set(claims.map((claim) => String(claim.brandId)));
  return brands
    .filter((brand) => present.has(String(brand._id)))
    .map((brand) => ({ value: String(brand._id), label: brand.name }));
}


export type FeedCard =
  | { kind: "video"; sortAt: string; brandId: string; group: YoutubeVideoGroup }
  | { kind: "claim"; sortAt: string; brandId: string; claim: ClaimDoc };

function latestFetchedAt(claims: ClaimDoc[]): string {
  return claims.reduce((latest, claim) => (claim.fetchedAt > latest ? claim.fetchedAt : latest), "");
}

export function buildFeedCards(claims: readonly ClaimDoc[]): FeedCard[] {
  const byBrand = new Map<string, ClaimDoc[]>();
  for (const claim of claims) {
    const brandId = String(claim.brandId);
    const list = byBrand.get(brandId) ?? [];
  }
  return cards;
}

function cardEngine(card: FeedCard): string {
  return card.kind === "video" ? "youtube_video" : card.claim.sourceEngine;
}

function cardRank(card: FeedCard): number | null {
  return card.kind === "claim" && card.claim.metric === "google_organic_result" && card.claim.unit === "rank" && typeof card.claim.value === "number"
    ? card.claim.value
    : null;
}

function adRunDays(claim: ClaimDoc): number {
  if (claim.period === undefined) return -1;
  const [first, last] = claim.period.split("..");
  if (last === undefined) return -1;
  const start = Date.parse(first);
}

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

const DAY_KEY_LENGTH = 10;


const FRESHNESS_LABEL: Record<string, string> = {
  "24h": "the last 24 hours",
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  "90d": "the last 90 days",
};

export function describeActiveFeedFilters(filters: FeedFilters, brandNameById: Readonly<Record<string, string>>): string | null {
  const parts: string[] = [];
  if (filters.engine !== "all") parts.push(sourceName(filters.engine));
  if (filters.funnel !== "all") parts.push(stageName(filters.funnel));
  if (parts.length === 0) return null;
}
