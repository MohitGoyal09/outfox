import type { Doc } from "@/convex/_generated/dataModel";
import type { DistributionItem } from "../DistributionPanel";
import {
  FUNNEL_STAGES,
  HOOK_TYPES,
  deltaTone,
  formatDelta,
  formatSharePct,
  shareOf,
  type Tone,
} from "../tokens";

export type BoardRun = Doc<"runs">;
export type BoardClaim = Doc<"claims">;
export type BoardSnapshot = Doc<"snapshots">;
export type BoardBrand = Doc<"brands">;

export const BOARD_HONESTY_LINE =
  "Every ranking here is by evidence, never by performance. Public search shows what a rival publishes, not what sells, so this board weighs how much we hold and what mix it carries, and never scores a campaign by its results.";

export const LEADERBOARD_RULE_LINE = "Ranked by evidence volume and mix, not performance.";

export const EMERGING_BASIS_LINE =
  "Hook share change between the two most recent runs for this cohort.";

export const DATA_ENGINES = [
  "google",
  "google_ads_transparency_center",
  "youtube",
  "youtube_video",
  "google_trends",
] as const;

export type DataEngine = (typeof DATA_ENGINES)[number];

const ENGINE_LABEL: Record<string, string> = {
  google: "google",
  google_ads_transparency_center: "ads_transparency",
  youtube: "youtube",
  youtube_video: "youtube_video",
  google_trends: "trends",
};

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
  const cohortKey = requestedCohortKey ?? sorted[0]?.cohortKey ?? null;
  return {
    cohortKey,
    current: matching[0] ?? null,
    previous: matching[1] ?? null,
  };
}

function countBy(values: Array<string | undefined>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value === undefined) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
}

function presentOnScale(
  scale: readonly string[],
  current: Map<string, number>,
  previous: Map<string, number> | null,
): string[] {
  return scale.filter(
    (value) => (current.get(value) ?? 0) > 0 || (previous?.get(value) ?? 0) > 0,
  );
}

export function deriveFunnelDistribution(
  claims: BoardClaim[],
  previous: BoardClaim[] | null,
): DistributionItem[] {
  const current = countBy(claims.map((claim) => claim.funnelStage));
  const total = sumValues(current);
  const priorTotal = prior === null ? null : sumValues(prior);
  return presentOnScale(FUNNEL_STAGES, current, prior).map((stage) => {
    const count = current.get(stage) ?? 0;
    const sharePct = shareOf(count, total);
    const priorShare = prior === null ? null : shareOf(prior.get(stage) ?? 0, priorTotal);
    const delta =
      sharePct === null || priorShare === null ? null : sharePct - priorShare;
    return {
      label: stage,
      count,
      sharePct,
      delta,
      deltaUnit: "pct" as const,
    };
  });
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
};

export function deriveLeaderboard(
  claims: BoardClaim[],
  brandIds: string[],
  brandNames: Record<string, string>,
): BrandLeader[] {
  const byBrand = new Map<string, BoardClaim[]>();
  for (const brandId of brandIds) byBrand.set(brandId, []);
  for (const claim of claims) {
    const bucket = byBrand.get(String(claim.brandId));
    if (bucket !== undefined) bucket.push(claim);
  }
  const rows = brandIds.map((brandId) => {
    const hooks = countBy(bucket.map((claim) => claim.hookType));
    let topHook: string | null = null;
    for (const [hook, count] of hooks) {
      if (count > topHookCount) {
        topHook = hook;
      }
    }
    const engines = new Set(bucket.map((claim) => claim.sourceEngine));
    return {
      brandId,
      brandName: brandNames[brandId] ?? brandId.slice(0, 8),
      claimCount: bucket.length,
      engineCount: engines.size,
      hookBreadth: hooks.size,
      topHook,
      topHookCount,
    };
  });
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
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
  cells: EngineCell[];
};

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
          reason: cell.reason ?? cell.status,
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
  tone: Tone;
};
