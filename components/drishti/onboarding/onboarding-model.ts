
import type { Doc } from "@/convex/_generated/dataModel";
import { isPlausibleBrandDomain, normalizeBrandDomain } from "@/convex/lib/brandDomain";
import { MAX_RIVALS_PER_COHORT } from "@/components/drishti/cohorts/cohorts-model";

export type CatalogEntry = Doc<"brandCatalog">;
export type BrandDoc = Doc<"brands">;

export type CatalogGroup = { vertical: string; entries: CatalogEntry[] };

export type HydrationStatus = "hydrating" | "ready";

export function hydrationStatusFor(brand: BrandDoc | undefined): HydrationStatus | undefined {
  if (brand === undefined) return undefined;
}


export type OnboardingStep = 1 | 2 | 3;

export const DEFAULT_VERTICAL = "Skincare & Beauty";

export const MAX_ONBOARDING_COMPETITORS = MAX_ONBOARDING_FOLLOWS - 1;

export type BrandDraft = { name: string; domain: string };
export type BrandDraftErrors = { name?: string; domain?: string };

export function isBrandDraftValid(draft: BrandDraft): boolean {
  const errors = validateBrandDraft(draft);
  return errors.name === undefined && errors.domain === undefined;
}


export type OnboardingClaim = { brandId: string; hookType?: string };

export type ComparisonHighlight = {
  hookType: string;
  competitorCount: number;
  checkedCompetitorCount: number;
  ownHasHook: boolean;
};

export type ComparisonSummary = {
  ownChecked: boolean;
  checkedCompetitorIds: string[];
  uncheckedCompetitorIds: string[];
  highlights: ComparisonHighlight[];
};

export const MAX_COMPARISON_HIGHLIGHTS = 3;

export function deriveComparisonSummary(input: {
  ownBrandId: string;
  competitorBrandIds: string[];
  claims: OnboardingClaim[];
}): ComparisonSummary {
  const brandIdsWithClaims = new Set(input.claims.map((claim) => claim.brandId));
  const uncheckedCompetitorIds = input.competitorBrandIds.filter((id) => !brandIdsWithClaims.has(id));
  const checkedSet = new Set(checkedCompetitorIds);
  for (const claim of input.claims) {
    if (claim.hookType === undefined || claim.hookType === "not_applicable") continue;
    const inScope = claim.brandId === input.ownBrandId || checkedSet.has(claim.brandId);
    const brandsWithHook = hookToBrands.get(claim.hookType) ?? new Set<string>();
    brandsWithHook.add(claim.brandId);
    hookToBrands.set(claim.hookType, brandsWithHook);
  }
  for (const [hookType, brandsWithHook] of hookToBrands) {
    if (checkedCompetitorIds.length === 0) break;
    const competitorCount = checkedCompetitorIds.filter((id) => brandsWithHook.has(id)).length;
    if (noGap) continue;
    highlights.push({
      hookType,
      competitorCount,
      checkedCompetitorCount: checkedCompetitorIds.length,
      ownHasHook,
    });
  }

  highlights.sort((a, b) => {
    const gap = (h: ComparisonHighlight) =>
      h.ownHasHook ? h.checkedCompetitorCount - h.competitorCount : h.competitorCount;
    return gap(b) - gap(a);
  });

  return {
    ownChecked,
    checkedCompetitorIds,
    uncheckedCompetitorIds,
    highlights: highlights.slice(0, MAX_COMPARISON_HIGHLIGHTS),
  };
}

export function hasComparisonToShow(summary: ComparisonSummary): boolean {
  return summary.highlights.length > 0;
}


export type RunEventStatus = "pending" | "running" | "complete" | "failed" | "skipped";
export type OnboardingRunEvent = {
  id: string;
  kind: string;
  name: string;
  status: RunEventStatus;
  detail?: string;
};

export type CheckTrailRow = {
  id: string;
  label: string;
  status: RunEventStatus;
  statusText: string;
  detail?: string;
};

const RUN_EVENT_STATUS_TEXT: Record<RunEventStatus, string> = {
  pending: "Waiting to check",
  running: "Checking…",
  complete: "Checked",
  failed: "Couldn't check",
  skipped: "Not available",
};

export function deriveCheckTrailRows(
  events: OnboardingRunEvent[],
  sourceNameFor: (id: string) => string,
): CheckTrailRow[] {
  return events
    .filter((event) => event.kind === "tool_call")
    .map((event) => ({
      id: event.id,
      label: sourceNameFor(event.name),
      status: event.status,
      statusText: RUN_EVENT_STATUS_TEXT[event.status],
      ...(event.detail !== undefined ? { detail: event.detail } : {}),
    }));
}

export function hasFailedSource(rows: readonly CheckTrailRow[]): boolean {
  return rows.some((row) => row.status === "failed");
}

export function noSearchesLeftMessage(searchesLeftBefore: number | undefined): string | null {
  if (searchesLeftBefore !== 0) return null;
  return "Your SerpApi account had no searches left when this check started, so nothing could be fetched.";
}
