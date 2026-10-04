
import { displayClaimText } from "../brands/format";
import { sourceKey, sourceName } from "../labels";
import { hookName } from "../labels";
import { deriveEmerging } from "../board/board-model";
import { HOOK_TYPES, isHookType, isValidEvidenceHref, type HookType } from "../tokens";


export type BrandLike = {
  id: string;
  name: string;
  domain: string;
};

export type RunStatus = "running" | "complete" | "partial" | "failed";

export type RunLike = {
  id: string;
  brandIds: string[];
  status: RunStatus;
  requestedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
};

export type FeedClaim = {
  id: string;
  runId: string;
  brandId: string;
  text: string;
  sourceEngine: string;
  hookType: string | null;
  fetchedAt: string;
  evidenceUrl: string;
};

export type BrandNameById = Readonly<Record<string, string>>;

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}


export const TRACKED_ENGINES = [
  "google",
  "google_ads_transparency_center",
  "youtube",
  "youtube_video",
  "google_trends",
] as const;

const TRACKED_ENGINE_SET: ReadonlySet<string> = new Set<string>(TRACKED_ENGINES);



export type BrandCoverage = {
  brandId: string;
  lastRunAny: RunLike | null;
  lastFinishedRun: RunLike | null;
  previousFinishedRun: RunLike | null;
  hasData: boolean;
};

function sortedByRequestedAtDesc(runs: readonly RunLike[]): RunLike[] {
  return [...runs].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : a.requestedAt > b.requestedAt ? -1 : 0));
}

export function brandCoverage(
  brands: readonly BrandLike[],
  runs: readonly RunLike[],
): Map<string, BrandCoverage> {
  for (const brand of brands) {
    const related = runs.filter((run) => run.brandIds.includes(brand.id));
    const lastRunAny = latestByRequestedAt(related);
    out.set(brand.id, {
      brandId: brand.id,
      lastRunAny,
      lastFinishedRun: finished[0] ?? null,
      previousFinishedRun: finished[1] ?? null,
      hasData: finished.length > 0,
    });
  }
  return out;
}


export const STALE_RUN_DAYS = 14;

export type AttentionReason = "never_run" | "failed" | "stale";

const REASON_RANK: Record<AttentionReason, number> = {
  never_run: 0,
  failed: 1,
  stale: 2,
};

export type AttentionRow = {
  brandId: string;
  brandName: string;
  reason: AttentionReason;
  detail: string;
  actionHref: string;
  actionLabel: string;
  isOwnBrand: boolean;
};


export type RunSourceCount = {
  runId: string;
  brandId: string;
  sourceEngine: string;
  count: number;
};

export type SourceChange = {
  source: string;
  sourceLabel: string;
  delta: number;
};

export type BrandChange = {
  brandId: string;
  brandName: string;
  sentence: string;
  actionHref: string;
  isOwnBrand: boolean;
  isQuiet?: boolean;
};

export type WhatChangedFeed = {
  changes: BrandChange[];
  biggestMove?: BiggestMove | null;
  comparableBrandCount: number;
};

export type BiggestMove = { brandName: string; hook: string; deltaPct: number; sentence: string };

type MoveClaim = Parameters<typeof deriveEmerging>[0][number];

function countsByEngine(
  counts: readonly RunSourceCount[],
  runId: string,
  brandId: string,
): Map<string, number> {
  for (const row of counts) {
    if (row.runId !== runId || row.brandId !== brandId) continue;
    if (row.sourceEngine === "llm_tag") continue; // synthetic tagging pass, not a source
    const key = sourceKey(row.sourceEngine);
  }
  return out;
}

function describeSourceChange(change: SourceChange): string {
  const count = Math.abs(change.delta);
  const noun = pluralize(count, "finding");
  return change.delta > 0
    ? `${count} new ${noun} from ${change.sourceLabel}`
    : `${count} fewer ${noun} from ${change.sourceLabel}`;
}

export function composeWhatChanged(
  brands: readonly BrandLike[],
  runs: readonly RunLike[],
  sourceCounts: readonly RunSourceCount[],
  brandNameById: BrandNameById,
  nowMs: number,
  ownBrandId: string | null = null,
): WhatChangedFeed | null {
  const coverage = brandCoverage(brands, runs);
  let comparableBrandCount = 0;

  for (const brand of brands) {
    if (cov === undefined || cov.lastFinishedRun === null || cov.previousFinishedRun === null) continue;
    comparableBrandCount += 1;
    const sources = new Set([...latest.keys(), ...prior.keys()]);

    const sourceChanges: SourceChange[] = [];

    const brandName = brandNameById[brand.id] ?? brand.name;
    const sinceIso = cov.previousFinishedRun.completedAt ?? cov.previousFinishedRun.requestedAt;
    const since = relativeTime(sinceIso, nowMs);

    const changeDescription = joinWithAnd(sourceChanges.map(describeSourceChange));
    const sentence = isOwnBrand
      ? `Your brand, ${brandName}, now has ${changeDescription} since your last check, ${since}.`
      : `${brandName} now has ${changeDescription} since your last check, ${since}.`;
  }

  return { changes: dated.map((row) => row.change), comparableBrandCount };
}


export const MAX_NEWEST_EVIDENCE = 6;

export type EvidenceItem = {
  id: string;
  brandId: string;
  brandName: string;
  text: string;
  engine: string;
  engineLabelText: string;
  hookType: HookType | null;
  fetchedAt: string;
  evidenceUrl: string;
  isOwnBrand: boolean;
};

export type EvidenceFeed = {
  items: EvidenceItem[];
  total: number;
  bounded: boolean;
};

export function composeNewestEvidence(
  claims: readonly FeedClaim[],
  brandNameById: BrandNameById,
  limit = MAX_NEWEST_EVIDENCE,
  ownBrandId: string | null = null,
): EvidenceFeed {
  const eligible = claims.filter(
    (claim) =>
      claim.text.trim() !== "" &&
      claim.sourceEngine !== "llm_tag" &&
      isValidEvidenceHref(claim.evidenceUrl),
  );
  const sorted = [...eligible].sort((a, b) => (a.fetchedAt < b.fetchedAt ? 1 : a.fetchedAt > b.fetchedAt ? -1 : 0));
  const perBrand = new Map<string, number>();
  const spread: FeedClaim[] = [];
  const overflow: FeedClaim[] = [];
  for (const claim of sorted) {
    const seen = perBrand.get(claim.brandId) ?? 0;
    if (seen < MAX_NEWEST_EVIDENCE_PER_BRAND) {
      perBrand.set(claim.brandId, seen + 1);
    } else {
      overflow.push(claim);
    }
  }
  const items = [...spread, ...overflow].slice(0, Math.max(0, limit)).map((claim) => ({
    id: claim.id,
    brandId: claim.brandId,
    brandName: brandNameById[claim.brandId] ?? claim.brandId,
    text: displayClaimText(claim.text),
    engine: claim.sourceEngine,
    engineLabelText: sourceName(claim.sourceEngine),
    hookType: claim.hookType !== null && isHookType(claim.hookType) ? claim.hookType : null,
    fetchedAt: claim.fetchedAt,
    evidenceUrl: claim.evidenceUrl.trim(),
    isOwnBrand: claim.brandId === ownBrandId,
  }));
  return { items, total: eligible.length, bounded: eligible.length > items.length };
}


export type LeadingHook = {
  hook: HookType;
  count: number;
  taggedCount: number;
  brandIds: string[];
};

function leadingHook(claims: readonly FeedClaim[]): LeadingHook | null {
  const tagged = claims.filter(
    (claim): claim is FeedClaim & { hookType: HookType } =>
      claim.hookType !== null && isHookType(claim.hookType) && claim.hookType !== "not_applicable",
  );

  const byHook = new Map<HookType, (FeedClaim & { hookType: HookType })[]>();
  for (const claim of tagged) {
    group.push(claim);
    byHook.set(claim.hookType, group);
  }
  for (const hook of HOOK_TYPES) {
    const group = byHook.get(hook);
    if (!group || group.length === 0) continue;
    if (best === null || group.length > best.group.length) best = { hook, group };
  }
  if (best === null) return null;

  return {
    hook: best.hook,
    count: best.group.length,
    taggedCount: tagged.length,
    brandIds: [...new Set(best.group.map((claim) => claim.brandId))].sort(),
  };
}

export type Emerging = {
  hook: HookType;
  hookLabelText: string;
  count: number;
  taggedCount: number;
  brandNames: string[];
  sharePct: number;
};

export function composeEmerging(
  claims: readonly FeedClaim[],
  coverage: ReadonlyMap<string, BrandCoverage>,
  brandNameById: BrandNameById,
): Emerging | null {
  const leading = leadingHook(pooled);
  return {
    hook: leading.hook,
    hookLabelText: hookName(leading.hook),
    count: leading.count,
    taggedCount: leading.taggedCount,
    brandNames: leading.brandIds.map((id) => brandNameById[id] ?? id),
    sharePct: Math.round((leading.count / leading.taggedCount) * 100),
  };
}


export const MAX_RECENT_THREADS = 5;

export type ThreadLike = {
  threadKey: string;
  title: string;
  lastMessageAt: string;
};

export type BoardLike = {
  id: string;
  name: string;
  createdAt: string;
};

export function threadHref(threadKey: string): string {
  return threadKey === "" ? "/ask" : `/ask?chat=${encodeURIComponent(threadKey)}`;
}

export function recentThreads(
  threads: readonly ThreadLike[],
  limit = MAX_RECENT_THREADS,
): ThreadLike[] {
  return [...threads]
    .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : a.lastMessageAt > b.lastMessageAt ? -1 : 0))
    .slice(0, limit);
}

const BOARD_ITEM_CAP = 500;

export function boardItemCountLabel(count: number | null): string | null {
  const shown = Intl.NumberFormat("en-US").format(count);
  return `${shown} ${count === 1 ? "item" : "items"}`;
}
