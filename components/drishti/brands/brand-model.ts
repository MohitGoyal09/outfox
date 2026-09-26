
import type { DistributionItem } from "../DistributionPanel";
import type { Doc } from "@/convex/_generated/dataModel";
import { sourceName } from "@/components/drishti/labels";
import { ABSENT, FUNNEL_STAGES, type Tone } from "../tokens";
import {
  compactCount,
  decodeClaimEntities,
  parseDescriptionLinkAnchor,
  parseRelatedVideoViews,
  parseShoppingPrice,
} from "./format";

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
  "google_news",
] as const;

export type FetchEngine = (typeof FETCH_ENGINES)[number];

export function isFetchEngine(value: string): value is FetchEngine {
  return (FETCH_ENGINES as readonly string[]).includes(value);
}

export type BrandEvidenceSummary = {
  brandId: string;
  evidenceCount: number;
  engines: string[];
};

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


export type OwnBrandSplit = { own: BrandDoc | null; competitors: BrandDoc[] };

export function splitOwnBrand(brands: readonly BrandDoc[]): OwnBrandSplit {
  const competitors = brands.filter((brand) => brand.isOwnBrand !== true);
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

const NOT_APPLICABLE = "not_applicable";

function realValue(value: string | undefined): string | undefined {
  return value === NOT_APPLICABLE ? undefined : value;
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

export function runHasRealTagForEngines(
  claims: ClaimDoc[],
  runId: string,
  engines: readonly string[],
): boolean {
  return tagsForEngineSubset(claims, runId, engines).some(
    (claim) => realValue(claim.hookType) !== undefined,
  );
}

export function mostRecentTaggedRunForEngines(
  claims: ClaimDoc[],
  runsDesc: RunDoc[],
  engines: readonly string[],
): RunDoc | null {
  for (const run of runsDesc) {
    if (runHasRealTagForEngines(claims, String(run._id), engines)) return run;
  }
  return null;
}


export type YoutubeVideoGroup = {
  videoId: string;
  evidenceUrl: string;
  title: string | null;
  description: string | null;
  publishedDate: string | null;
  viewCount: number | null;
  likeCount: number | null;
  length: string | null;
  claims: ClaimDoc[];
};

export function youtubeVideoIdOf(claim: Pick<ClaimDoc, "sourceQuery" | "evidenceUrl">): string {
  const fromQuery = claim.sourceQuery.match(/youtube_video\s+(\S+)/)?.[1];
}

function numberValue(claim: ClaimDoc | undefined): number | null {
  return typeof claim?.value === "number" ? claim.value : null;
}

export function groupYoutubeVideoClaims(claims: ClaimDoc[]): YoutubeVideoGroup[] {
  const byUrl = new Map<string, ClaimDoc[]>();
  return [...byUrl.entries()]
    .map(([evidenceUrl, groupClaims]) => {
      const find = (metric: string) =>
        groupClaims.find((claim) => claim.metric === metric);
      return {
        videoId: youtubeVideoIdOf(groupClaims[0]),
        evidenceUrl,
        title: stringValue(find("youtube_video_title")),
        description: stringValue(find("youtube_video_description")),
        publishedDate: stringValue(find("youtube_video_published_date")),
        viewCount: numberValue(find("youtube_video_view_count")),
        likeCount: numberValue(find("youtube_video_like_count")),
        length: stringValue(find("youtube_video_length")),
        claims: groupClaims,
      };
    })
    .sort(
      (a, b) =>
        b.claims.length - a.claims.length || a.videoId.localeCompare(b.videoId),
    );
}

type RecordLike = Record<string, unknown>;

function asRecord(value: unknown): RecordLike | null {
  return typeof value === "object" && value !== null
    ? (value as RecordLike)
    : null;
}

export function findYoutubeRawVideo(
  rawResponse: unknown,
  videoId: string,
): unknown {
  const videos = Array.isArray(root?.videos) ? root.videos : [];
  for (const entry of videos) {
    if (record !== null && record.videoId === videoId) {
      return record.data ?? null;
    }
  }
  return null;
}

export type YoutubeRawVideoInfo = {
  thumbnailUrl: string | null;
  channelName: string | null;
  channelThumbnailUrl: string | null;
  subscribers: string | number | null;
};

export function readYoutubeRawVideo(raw: unknown): YoutubeRawVideoInfo {
  const root = asRecord(raw);
  const channel = asRecord(root?.channel);
  const channelThumbnailUrl =
    typeof channel?.thumbnail === "string" ? channel.thumbnail : null;
  const subscribersRaw = channel?.subscribers;
  const subscribers =
    typeof subscribersRaw === "string" || typeof subscribersRaw === "number"
      ? subscribersRaw
      : null;
  return { thumbnailUrl, channelName, channelThumbnailUrl, subscribers };
}


export function findGoogleNewsRawItem(
  rawResponse: unknown,
  evidenceUrl: string,
): unknown {
  const items = Array.isArray(root?.news_results) ? root.news_results : [];
  for (const entry of items) {
  }
  return null;
}

export type GoogleNewsRawItem = {
  thumbnailUrl: string | null;
  publisherName: string | null;
  snippet: string | null;
};

export function readGoogleNewsRawItem(raw: unknown): GoogleNewsRawItem {
  const record = asRecord(raw);
  const source = asRecord(record?.source);
  const thumbnailUrl = typeof record?.thumbnail === "string" ? record.thumbnail : null;
  const publisherName = typeof source?.name === "string" ? source.name : null;
  const snippet = typeof record?.snippet === "string" ? record.snippet : null;
  return { thumbnailUrl, publisherName, snippet };
}


export type GoogleOrganicRawItem = { faviconUrl: string | null; snippet: string | null; sourceName: string | null };

export function findGoogleOrganicRawItem(rawResponse: unknown, evidenceUrl: string): unknown {
  return null;
}

export function readGoogleOrganicRawItem(raw: unknown): GoogleOrganicRawItem {
  const record = asRecord(raw);
  const snippet = typeof record?.snippet === "string" ? record.snippet : null;
  const sourceName = typeof record?.source === "string" ? record.source : null;
  return { faviconUrl, snippet, sourceName };
}


export type YoutubeSearchResultRow = {
  title: string | null;
  link: string | null;
  channelName: string | null;
  views: number | null;
  length: string | null;
  thumbnailUrl: string | null;
};

function looseThumbnailUrl(value: unknown): string | null {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  if (record === null) return null;
  if (typeof record.static === "string") return record.static;
  if (typeof record.rich === "string") return record.rich;
  return null;
}

export function youtubeSearchResultRows(rawResponse: unknown): YoutubeSearchResultRow[] {
  const items = Array.isArray(root?.video_results) ? root.video_results : [];
  return items.flatMap((entry): YoutubeSearchResultRow[] => {
    if (record === null) return [];
    const channel = asRecord(record.channel);
    return [
      {
        title: typeof record.title === "string" ? record.title : null,
        link: typeof record.link === "string" ? record.link : null,
        channelName: typeof channel?.name === "string" ? channel.name : null,
        views: looseNumber(record.views ?? record.view_count),
        length: typeof record.length === "string" ? record.length : null,
        thumbnailUrl: looseThumbnailUrl(record.thumbnail),
      },
    ];
  });
}


export function tagsForClaim(tags: ClaimDoc[], claim: ClaimDoc): ClaimDoc[] {
  return tags.filter(
    (tag) =>
      String(tag._id) === String(claim._id) ||
      (tag.taggedClaimId !== undefined && String(tag.taggedClaimId) === String(claim._id)),
  );
}


export type LabeledCount = { label: string; count: number };

export function valuePropFrequency(tags: ClaimDoc[]): LabeledCount[] {
  const counts = new Map<string, number>();
  for (const tag of tagBearingClaims(tags)) {
    const value = tag.valueProp;
    if (value === undefined || value.trim() === "") continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
}

export type HookDriftRow = { label: string; current: number; previous: number };

export function hookMixDrift(claims: ClaimDoc[], previous: ClaimDoc[]): HookDriftRow[] {
  const currentItems = hookDistribution(claims);
  const toMap = (items: DistributionItem[]) => new Map(items.map((item) => [item.label, item.count ?? 0]));
  const previousMap = toMap(previousItems);
  const labels = new Set([...currentMap.keys(), ...previousMap.keys()]);
  return [...labels]
    .map((label) => ({ label, current: currentMap.get(label) ?? 0, previous: previousMap.get(label) ?? 0 }))
    .sort((a, b) => b.current - a.current || b.previous - a.previous);
}

export function hookTypeFrequency(tags: ClaimDoc[]): LabeledCount[] {
  const counts = new Map<string, number>();
}


export type RankBucket = { label: string; min: number; max: number; count: number };

export function organicRankBuckets(claims: ClaimDoc[]): RankBucket[] {
}


export function relatedQuestionClaims(claims: ClaimDoc[]): ClaimDoc[] {
  return claims.filter((claim) => claim.metric === "google_related_question");
}

export function relatedSearchClaims(claims: ClaimDoc[]): ClaimDoc[] {
  return claims.filter((claim) => claim.metric === "google_related_search");
}

export function youtubeShortResultClaims(claims: ClaimDoc[]): ClaimDoc[] {
  return claims.filter((claim) => claim.metric === "youtube_short_result");
}

export function newsPublisherClaims(claims: ClaimDoc[]): ClaimDoc[] {
  return claims.filter((claim) => claim.metric === "google_news_publisher");
}

export function newsPublisherRanking(claims: ClaimDoc[]): LabeledCount[] {
  const counts = new Map<string, number>();
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export function youtubeShoppingResultClaims(claims: ClaimDoc[]): ClaimDoc[] {
  return claims.filter((claim) => claim.metric === "youtube_shopping_result");
}

export function youtubeDescriptionLinkClaims(claims: ClaimDoc[]): ClaimDoc[] {
  return claims.filter((claim) => claim.metric === "youtube_description_link");
}

export type EvidenceCatalogRow = {
  key: string;
  primary: string;
  meta: string | null;
  evidenceUrl: string;
};

export function relatedVideoCatalogRows(claims: ClaimDoc[]): EvidenceCatalogRow[] {
  return youtubeRelatedVideoClaims(claims).map((claim) => {
    const title = typeof claim.value === "string" ? claim.value : claim.text;
    const views = parseRelatedVideoViews(claim.text);
    const channel = typeof claim.unit === "string" ? claim.unit : null;
    return {
      key: String(claim._id),
      primary: decodeClaimEntities(title),
      meta: joinMeta([channel, views !== null ? `${compactCount(views)} views` : null]),
      evidenceUrl: claim.evidenceUrl,
    };
  });
}

export function shoppingResultCatalogRows(claims: ClaimDoc[]): EvidenceCatalogRow[] {
  return youtubeShoppingResultClaims(claims).map((claim) => {
    const title = typeof claim.value === "string" ? claim.value : claim.text;
    const vendor = typeof claim.unit === "string" ? claim.unit : null;
    const price = parseShoppingPrice(claim.text);
    return {
      key: String(claim._id),
      primary: decodeClaimEntities(title),
      meta: joinMeta([vendor, price]),
      evidenceUrl: claim.evidenceUrl,
    };
  });
}

export function descriptionLinkCatalogRows(claims: ClaimDoc[]): EvidenceCatalogRow[] {
  return youtubeDescriptionLinkClaims(claims).map((claim) => {
    const url = typeof claim.value === "string" ? claim.value : claim.evidenceUrl;
    const anchor = parseDescriptionLinkAnchor(claim.text);
  });
}

export function aiOverviewClaims(claims: ClaimDoc[]): ClaimDoc[] {
  return claims.filter((claim) => claim.metric === "google_ai_overview");
}

export function productListingClaims(claims: ClaimDoc[]): ClaimDoc[] {
  return claims.filter((claim) => claim.metric === "google_product_listing");
}

export function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export type RetailerListingRow = { hostname: string; count: number };

export type PricePoint = { claimId: string; hostname: string | null; price: number; unit: string | null; fetchedAt: string };

export function pricePoints(claims: ClaimDoc[]): PricePoint[] {
  return productListingClaims(claims)
    .filter((claim): claim is ClaimDoc & { value: number } => typeof claim.value === "number")
    .map((claim) => ({
      claimId: String(claim._id),
      hostname: hostnameOf(claim.evidenceUrl),
      price: claim.value,
      unit: claim.unit ?? null,
      fetchedAt: claim.fetchedAt,
    }))
    .sort((a, b) => a.price - b.price);
}


export type CreatorRow = { channelName: string; totalViews: number; videoCount: number; owned: boolean; subscribers: number | null };

export function creatorRowsFromGroups(
  groups: YoutubeVideoGroup[],
  rawResponse: unknown,
  brandName: string,
): CreatorRow[] {
  const byChannel = new Map<string, CreatorRow>();
  for (const group of groups) {
    const raw = readYoutubeRawVideo(findYoutubeRawVideo(rawResponse, group.videoId));
    if (raw.channelName === null) continue;
    const views = group.viewCount ?? 0;
    const subscribers = groupSubscriberCount(group);
    const existing = byChannel.get(raw.channelName);
    if (existing !== undefined) {
      existing.totalViews += views;
      existing.videoCount += 1;
      if (existing.subscribers === null && subscribers !== null) existing.subscribers = subscribers;
    }
  }
}

export function mergeCreatorRows(base: CreatorRow[], searchRows: YoutubeSearchResultRow[], brandName: string): CreatorRow[] {
  const byChannel = new Map(base.map((row) => [row.channelName, { ...row }]));
  for (const row of searchRows) {
    if (row.channelName === null || row.views === null) continue;
    const existing = byChannel.get(row.channelName);
    if (existing !== undefined) {
      existing.totalViews += row.views;
      existing.videoCount += 1;
    }
    byChannel.set(row.channelName, {
      channelName: row.channelName,
      totalViews: row.views,
      videoCount: 1,
      owned: namesLikelyMatch(row.channelName, brandName),
      subscribers: null,
    });
  }
}


export type AdRuntimeRow = {
  claimId: string;
  title: string;
  format: string;
  firstShown: string | null;
  lastShown: string | null;
  runDays: number | null;
  evidenceUrl: string;
};

function parseAdPeriod(period: string | undefined): { firstShown: string | null; lastShown: string | null } {
  if (period === undefined) return { firstShown: null, lastShown: null };
  const [first, last] = period.split("..");
  if (last !== undefined) return { firstShown: first || null, lastShown: last || null };
}

function daysBetween(a: string, b: string): number | null {
  const end = Date.parse(b);
  return Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}

export function adRuntimeLeaderboard(claims: ClaimDoc[]): AdRuntimeRow[] {
  return adCreativeClaims(claims)
    .map(adCreativeWindow)
    .sort((a, b) => (b.runDays ?? -1) - (a.runDays ?? -1) || a.claimId.localeCompare(b.claimId));
}


export function themeFrequency(tags: ClaimDoc[]): LabeledCount[] {
  const counts = new Map<string, number>();
}
