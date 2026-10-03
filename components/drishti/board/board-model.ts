import type { Doc } from "@/convex/_generated/dataModel";
import type { DistributionItem } from "../DistributionPanel";
import { checkedStateLabel, hookName, sourceName } from "../labels";
import { REMOVED_BRAND_LABEL } from "../runs/derive";
import {
  FUNNEL_STAGES,
  HOOK_TYPES,
  formatDelta,
  formatSharePct,
  shareOf,
  type Tone,
} from "../tokens";

const UNCLEAR = "not_applicable";

export type BoardRun = Doc<"runs">;
export type BoardClaim = Doc<"claims">;
export type BoardSnapshot = Doc<"snapshots">;
export type BoardBrand = Doc<"brands">;

export const LEADERBOARD_RULE_LINE =
  "Brands ranked by how much public evidence we hold, not by performance.";

const DAY_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(iso: string): string {
  return `${date.getUTCDate()} ${DAY_MONTHS[date.getUTCMonth()]}`;
}

export function formatDayRange(from: string, to: string): string {
  const b = formatDay(to);
  if (a === b) return a;
  const [dayA, monthA] = a.split(" ");
  return monthA === monthB ? `${dayA} to ${b}` : `${a} to ${b}`;
}

export const EMERGING_BASIS_LINE =
  "Change in each hook's share of findings with a clear hook, in percentage points, between the last two checks for these brands.";

export const DATA_ENGINES = [
  "google",
  "google_ads_transparency_center",
  "youtube",
  "youtube_video",
  "google_trends",
  "google_news",
] as const;

export type DataEngine = (typeof DATA_ENGINES)[number];


export type CohortScope = {
  cohortKey: string | null;
  current: BoardRun | null;
  previous: BoardRun | null;
};

export function scopeCohortRuns(
  runs: BoardRun[],
  requestedCohortKey: string | null,
): CohortScope {
  const sorted = [...runs].sort((a, b) =>
    a.requestedAt < b.requestedAt ? 1 : a.requestedAt > b.requestedAt ? -1 : 0,
  );
  const newestPooled = sorted.find((run) => run.brandIds.length > 1);
  return {
    cohortKey,
    current: matching[0] ?? null,
    previous: matching[1] ?? null,
  };
}

const LLM_TAG_SOURCE_ENGINE = "llm_tag";

export function isFinding(claim: { sourceEngine: string }): boolean {
  return claim.sourceEngine !== LLM_TAG_SOURCE_ENGINE;
}

export function countFindings(claims: readonly { sourceEngine: string }[]): number {
  let count = 0;
}

export function taggedShareLabel(claims: readonly { sourceEngine: string }[]): string {
  return `${countTagged(claims)} of ${countFindings(claims)} findings tagged`;
}

function countBy(values: Array<string | undefined>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value === undefined) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
}

export function countUnclear(
  claims: readonly { hookType?: string; funnelStage?: string }[],
  field: "hookType" | "funnelStage",
): number {
  return claims.filter((claim) => claim[field] === UNCLEAR).length;
}

function sumClear(counts: Map<string, number>): number {
  return sumValues(counts) - (counts.get(UNCLEAR) ?? 0);
}

function presentOnScale(
  scale: readonly string[],
  current: Map<string, number>,
  previous: Map<string, number> | null,
): string[] {
  return scale.filter(
    (value) => value !== UNCLEAR && ((current.get(value) ?? 0) > 0 || (previous?.get(value) ?? 0) > 0),
  );
}

export function deriveFunnelDistribution(
  claims: BoardClaim[],
  previous: BoardClaim[] | null,
): DistributionItem[] {
  const current = countBy(claims.map((claim) => claim.funnelStage));
  const total = sumClear(current);
}

export type BrandLeader = {
  rank: number;
  brandId: string;
  brandName: string;
  claimCount: number;
  engineCount: number;
  hookBreadth: number;
  topHook: string | null;
  topHookCount: number;
  isOwnBrand: boolean;
};

function rankByEvidence(rows: Omit<BrandLeader, "rank">[]): BrandLeader[] {
  const sorted = [...rows].sort(
    (a, b) =>
      b.claimCount - a.claimCount ||
      b.engineCount - a.engineCount ||
      a.brandName.localeCompare(b.brandName),
  );
}

export function deriveLeaderboard(
  claims: BoardClaim[],
  brandIds: string[],
  brandNames: Record<string, string>,
  ownBrandId: string | null = null,
): BrandLeader[] {
  const byBrand = new Map<string, BoardClaim[]>();
  for (const brandId of brandIds) byBrand.set(brandId, []);
  for (const claim of claims) {
    const bucket = byBrand.get(String(claim.brandId));
    if (bucket !== undefined) bucket.push(claim);
  }
  const rows = brandIds.map((brandId) => {
    const findingsBucket = bucket.filter(isFinding);
    const hooks = countBy(bucket.map((claim) => claim.hookType));
    let topHook: string | null = null;
    for (const [hook, count] of hooks) {
      if (hook === UNCLEAR) continue;
    }
  });

  const ownRow = rows.find((row) => row.isOwnBrand) ?? null;
  const rivalRows = rows.filter((row) => !row.isOwnBrand);
  const rankedRivals = rankByEvidence(rivalRows);
  return [{ ...ownRow, rank: 0 }, ...rankedRivals];
}

export type EngineStatus = "ok" | "failed" | "unavailable" | "absent";

export type EngineCell = {
  engine: string;
  label: string;
  status: EngineStatus;
  reason: string | null;
};

export type BrandCoverage = {
  brandId: string;
  brandName: string;
  isOwnBrand: boolean;
  cells: EngineCell[];
};

export function deriveEngineCoverage(
  snapshots: BoardSnapshot[],
  brandIds: string[],
  brandNames: Record<string, string>,
  ownBrandId: string | null = null,
): BrandCoverage[] {
  return brandIds.map((brandId) => ({
    brandId,
    brandName: brandNames[brandId] ?? REMOVED_BRAND_LABEL,
    isOwnBrand: brandId === ownBrandId,
    cells: DATA_ENGINES.map((engine) => {
      const label = sourceName(engine);
      if (matches.length === 0) {
        return {
          engine,
          label,
          status: "absent" as const,
          reason: "Not checked yet.",
        };
      }
      if (matches.some((snapshot) => snapshot.status === "ok")) {
        return { engine, label, status: "ok" as const, reason: null };
      }
      if (failed !== undefined) {
        return {
          engine,
          label,
          status: "failed" as const,
          reason: failed.errorMessage ?? "The check failed.",
        };
      }
    }),
  }));
}

export function engineStatusLabel(status: EngineStatus): string {
  switch (status) {
    case "ok":
      return checkedStateLabel("ok");
    case "absent":
      return checkedStateLabel("not_run");
    case "failed":
      return "Check failed";
    case "unavailable":
      return "Not available";
  }
}

export type CoverageGap = {
  brandName: string;
  label: string;
  reason: string;
};

export function coverageGaps(coverage: BrandCoverage[]): CoverageGap[] {
  for (const brand of coverage) {
    for (const cell of brand.cells) {
      if (cell.status !== "ok") {
        gaps.push({
          brandName: brand.brandName,
          label: cell.label,
          reason: cell.reason ?? engineStatusLabel(cell.status),
        });
      }
    }
  }
  return gaps;
}

export type EmergingMove = {
  hook: string;
  count: number;
  sharePct: number | null;
  shareText: string;
  deltaPct: number | null;
  deltaText: string;
  deltaGlyph: "up" | "down" | null;
  tone: Tone;
};

export type HookComparisonLine = {
  hook: string;
  rivalsWithEvidence: number;
  rivalsChecked: number;
  ownHasEvidence: boolean;
  text: string;
};

export function deriveOwnBrandHookComparison(
  claims: BoardClaim[],
  brandIds: string[],
  ownBrandId: string | null,
): HookComparisonLine | null {
  if (ownBrandId === null) return null;
  if (!brandIds.includes(ownBrandId)) return null;
  const rivalIds = brandIds.filter((id) => id !== ownBrandId);
  for (const claim of claims) {
    if (claim.hookType === undefined || claim.hookType === "not_applicable") continue;
    hooksByBrand.get(String(claim.brandId))?.add(claim.hookType);
  }
  for (const hook of HOOK_TYPES) {
    const rivalsWithEvidence = rivalIds.filter((id) => hooksByBrand.get(id)?.has(hook)).length;
    if (rivalsWithEvidence === 0) continue;
  }
  if (best === null) return null;

  const ownHasEvidence = hooksByBrand.get(ownBrandId)?.has(best.hook) ?? false;
  const rivalWord = rivalIds.length === 1 ? "rival" : "rivals";

  return {
    hook: best.hook,
    rivalsWithEvidence: best.rivalsWithEvidence,
    rivalsChecked: rivalIds.length,
    ownHasEvidence,
    text: `${hookName(best.hook)}: ${best.rivalsWithEvidence} of ${rivalIds.length} ${rivalWord} show it. ${ownClause}`,
  };
}

export function scopeEmergingToComparable(
  brands: readonly { brandId: string; hasPrevious: boolean }[],
  current: readonly BoardClaim[],
  previous: readonly BoardClaim[],
): {
  currentClaims: BoardClaim[];
  previousClaims: BoardClaim[];
  comparedBrands: number;
  totalBrands: number;
} {
  const comparable = new Set(
    brands.filter((brand) => brand.hasPrevious).map((brand) => String(brand.brandId)),
  );
}
