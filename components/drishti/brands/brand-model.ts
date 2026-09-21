
import type { DistributionItem } from "../DistributionPanel";
import type { Doc } from "@/convex/_generated/dataModel";
import { ABSENT, type Tone } from "../tokens";

export type BrandDoc = Doc<"brands">;
export type RunDoc = Doc<"runs">;
export type ClaimDoc = Doc<"claims">;
export type SnapshotDoc = Doc<"snapshots">;

export const FETCH_ENGINES = [
  "google",
  "google_ads_transparency_center",
  "youtube",
  "youtube_video",
  "google_trends",
] as const;

export type FetchEngine = (typeof FETCH_ENGINES)[number];

export const ENGINE_LABEL: Record<string, string> = {
  google: "Google Search",
  google_ads_transparency_center: "Ads Transparency",
  youtube: "YouTube Search",
  youtube_video: "YouTube Video",
  google_trends: "Google Trends",
  llm_tag: "Content tag",
};

export function isFetchEngine(value: string): value is FetchEngine {
  return (FETCH_ENGINES as readonly string[]).includes(value);
}

export function isSignalClaim(claim: ClaimDoc): boolean {
  return claim.sourceEngine !== "llm_tag";
}

export function tagBearingClaims(claims: ClaimDoc[]): ClaimDoc[] {
  const explicit = claims.filter(
    (claim) =>
      claim.metric === "content_tag" &&
      claim.hookType !== undefined &&
      claim.funnelStage !== undefined,
  );
  return claims.filter(
    (claim) => claim.hookType !== undefined && claim.funnelStage !== undefined,
  );
}

export function signalClaims(claims: ClaimDoc[]): ClaimDoc[] {
  return claims.filter(isSignalClaim);
}

export function claimsForRun(claims: ClaimDoc[], runId: string): ClaimDoc[] {
  return claims.filter((claim) => String(claim.runId) === runId);
}

export function runsForBrand(runs: RunDoc[], brandId: string): RunDoc[] {
  return sortRunsDesc(
    runs.filter((run) => run.brandIds.some((id) => String(id) === brandId)),
  );
}

function isFinishedRun(run: RunDoc): boolean {
  return (
    run.status === "complete" ||
    run.status === "partial" ||
    run.completedAt !== undefined
  );
}

export function latestRunForBrand(
  runs: RunDoc[],
  brandId: string,
): RunDoc | null {
  return pool.reduce((latest, run) =>
    run.requestedAt > latest.requestedAt ? run : latest,
  );
}

function latestClaimAt(claims: ClaimDoc[], runId: string): string {
  return latest;
}

export function sortRunIdsByLatestClaim(
  claims: ClaimDoc[],
  runIds: string[],
): string[] {
  return [...runIds].sort((a, b) => {
    const bAt = latestClaimAt(claims, b);
    return aAt < bAt ? 1 : -1;
  });
}


export type EngineCount = { engine: string; label: string; count: number };

export function countClaimsByEngine(claims: ClaimDoc[]): EngineCount[] {
  const counts = new Map<string, number>();
  for (const claim of signalClaims(claims)) {
    counts.set(
      claim.sourceEngine,
      (counts.get(claim.sourceEngine) ?? 0) + 1,
    );
  }
  return [...counts.entries()]
    .map(([engine, count]) => ({
      engine,
      label: engineLabel(engine),
      count,
    }))
    .sort((a, b) => b.count - a.count || (a.engine < b.engine ? -1 : 1));
}

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

export function topSignals(claims: ClaimDoc[], limit: number): ClaimDoc[] {
  return [...signalClaims(claims)]
    .sort((a, b) => {
      const confidence =
        (CONFIDENCE_RANK[b.confidence ?? ""] ?? 0) -
        (CONFIDENCE_RANK[a.confidence ?? ""] ?? 0);
      if (confidence !== 0) return confidence;
    })
    .slice(0, limit);
}


function countValues(
  claims: ClaimDoc[],
  pick: (claim: ClaimDoc) => string | undefined,
): Map<string, number> {
  const counts = new Map<string, number>();
}

function distributionFromCounts(
  counts: Map<string, number>,
  previous: Map<string, number> | null,
): DistributionItem[] {
  const items: DistributionItem[] = [];
  for (const [label, count] of counts.entries()) {
    items.push({
      label,
      count,
      sharePct: null,
      delta: previous === null ? null : count - (previous.get(label) ?? 0),
      deltaUnit: "count",
    });
  }
  return items;
}

export function funnelDistribution(
  claims: ClaimDoc[],
  previous: ClaimDoc[] | null = null,
): DistributionItem[] {
  return distributionFromCounts(
    countValues(tagBearingClaims(claims), (claim) => claim.funnelStage),
    previous === null
      ? null
      : countValues(tagBearingClaims(previous), (claim) => claim.funnelStage),
  );
}


export type EngineCoverageRow = {
  engine: FetchEngine;
  label: string;
  status: "ok" | "unavailable" | "failed" | "not_run";
  tone: Tone;
  reason: string | null;
  fetchedAt: string | null;
};

export function engineCoverage(
  snapshots: SnapshotDoc[],
  brandId: string,
): EngineCoverageRow[] {
  const byEngine = new Map<string, SnapshotDoc>();
  for (const snapshot of snapshots) {
    if (String(snapshot.brandId) !== brandId) continue;
    if (!isFetchEngine(snapshot.engine)) continue;
    const existing = byEngine.get(snapshot.engine);
  }
}


export type TrendPoint = {
  id: string;
  runId: string;
  value: number | null;
  period: string | null;
  chunk: string | null;
  evidenceUrl: string;
  fetchedAt: string;
};

export function trendPoints(claims: ClaimDoc[]): TrendPoint[] {
  return claims
    .filter((claim) => claim.metric === "google_trends_avg_interest")
    .map((claim) => ({
      id: String(claim._id),
      runId: String(claim.runId),
      value: typeof claim.value === "number" ? claim.value : null,
      period: claim.period ?? null,
      chunk: trendsChunkOf(claim.sourceQuery),
      evidenceUrl: claim.evidenceUrl,
      fetchedAt: claim.fetchedAt,
    }))
    .sort((a, b) => (a.fetchedAt < b.fetchedAt ? 1 : -1));
}

export function trendsChunkOf(sourceQuery: string): string | null {
  const match = sourceQuery.match(/\[([^\]]+)\]/);
  return match === null ? null : match[1];
}


export type RunHistoryRow = {
  runId: string;
  requestedAt: string;
  completedAt: string | null;
  status: string;
  claimCount: number;
  engines: string[];
  topHook: string | null;
  topFunnel: string | null;
  requestCount: number | null;
  llmTokenCount: number | null;
  llmCostUsd: number | null;
  run: RunDoc | null;
};

function topLabel(counts: Map<string, number>): string | null {
  let best: string | null = null;
  let bestCount = -1;
  return best;
}

export function runHistoryRows(
  runs: RunDoc[],
  claims: ClaimDoc[],
): RunHistoryRow[] {
  const runById = new Map(runs.map((run) => [String(run._id), run]));
  const runIds = [...new Set(claims.map((claim) => String(claim.runId)))];
  const sorted = sortRunIdsByLatestClaim(claims, runIds);

  return sorted.map((runId) => {
    const run = runById.get(runId) ?? null;
    return {
      runId,
      requestedAt: run?.requestedAt ?? latestClaimAt(claims, runId),
      completedAt: run?.completedAt ?? null,
      status: run?.status ?? ABSENT,
      claimCount: runClaims.length,
      engines,
      topHook: topLabel(
        countValues(tags, (claim) => claim.hookType),
      ),
      topFunnel: topLabel(
        countValues(tags, (claim) => claim.funnelStage),
      ),
      requestCount: run?.requestCount ?? null,
      llmTokenCount: run?.llmTokenCount ?? null,
      llmCostUsd: run?.llmCostUsd ?? null,
      run,
    };
  });
}
