"use node";

import { serpapiFetch } from "../lib/serpapiClient";
import {
  TRENDS_CATEGORY_ANCHOR,
  TRENDS_CHUNK_SIZE,
  TRENDS_DATE_RANGE,
  TRENDS_GEO,
  YOUTUBE_VIDEOS_PER_BRAND,
} from "../../lib/constants";
import type { Doc, Id } from "../_generated/dataModel";

export type FetchBrand = Pick<Doc<"brands">, "_id" | "name">;

export type SnapshotEngine = "youtube" | "youtube_video" | "google_trends";

export type SnapshotStatus = "ok" | "failed";

export type SnapshotPayload = {
  runId: Id<"runs">;
  brandId: Id<"brands">;
  engine: SnapshotEngine;
  queryParams: Record<string, unknown>;
  region: string;
  fetchedAt: string;
  status: SnapshotStatus;
  errorMessage?: string;
  rawResponse?: unknown;
  period?: string;
  claimIds: Array<Id<"claims">>;
};

export type YoutubeSearchResult = {
  videoIds: string[];
  snapshot: SnapshotPayload;
  latencyMs: number;
  credits?: number;
};

export type YoutubeVideosResult = {
  snapshot: SnapshotPayload;
  latencyMs: number;
  credits?: number;
};

export type TrendsFetchResult = {
  snapshots: SnapshotPayload[];
  chunkKeys: string[];
  latencyMs: number;
  credits?: number;
};

export type UsageInput = {
  runId: Id<"runs">;
  engine: SnapshotEngine | string;
  latencyMs: number;
  credits?: number;
};

export type UsageRecord = {
  runId: Id<"runs">;
  engine: SnapshotEngine | string;
  latencyMs: number;
  creditCount?: number;
};

export type SerpapiFetchFn = typeof serpapiFetch;

/**
 * Fetch-layer budget: cap on planned SerpApi calls per fan-out entry point.
 * Checked up front by fetchGoogleTrends and fetchYoutubeVideos so a huge
 * cohort fails fast with a failed snapshot instead of fanning out.
 */
export const MAX_TASKS_PER_RUN = 30;

export type FetchBudget = { ok: true } | { ok: false; error: string };

export function checkFetchBudget(
  plannedCalls: number,
  limit: number = MAX_TASKS_PER_RUN,
): FetchBudget {
  if (!Number.isInteger(plannedCalls) || plannedCalls < 0) {
    return {
      ok: false,
      error: `plannedCalls must be a non-negative integer, got ${plannedCalls}`,
    };
  }
  if (plannedCalls > limit) {
    return {
      ok: false,
      error: `planned ${plannedCalls} calls exceed the fetch budget of ${limit}`,
    };
  }
  return { ok: true };
}

const MAX_QUERY_CHARS = 200;

function truncateQuery(value: string): string {
  return value.length > MAX_QUERY_CHARS
    ? value.slice(0, MAX_QUERY_CHARS)
    : value;
}

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{5,20}$/;

export function isValidVideoId(videoId: string): boolean {
  return VIDEO_ID_PATTERN.test(videoId);
}

const ADVERTISER_ID_PATTERN = /^[0-9-]{1,64}$/;

/**
 * Param builders, exported so the Phase 3 verifier asserts the exact
 * SerpApi params each adapter sends without any network call.
 */
export function buildGoogleSearchParams(brand: { name: string }) {
  return {
    engine: "google",
    q: truncateQuery(brand.name),
    gl: "in",
    hl: "en",
    google_domain: "google.co.in",
  };
}

/**
 * Google News matches on plain keyword relevance, unlike Google Search,
 * which has enough total results to filter a generic brand name down to the
 * right entity anyway. A one-word brand name that's also a common English
 * word ("Minimalist") returns generic lifestyle coverage or nothing, not the
 * brand's own news — so the query is disambiguated with the brand's vertical
 * when one is known, same real query, just a more specific one.
 */
export function buildGoogleNewsParams(brand: { name: string; vertical?: string }) {
  const query = brand.vertical ? `${brand.name} ${brand.vertical}` : brand.name;
  return {
    engine: "google_news",
    q: truncateQuery(query),
    gl: "in",
    hl: "en",
  };
}

export function buildAdsTransparencyParams(advertiserId: string) {
  return {
    engine: "google_ads_transparency_center",
    advertiser_id: advertiserId,
    region: "2356",
  };
}

export function buildYoutubeSearchParams(brand: { name: string }) {
  return {
    engine: "youtube",
    search_query: truncateQuery(brand.name),
    gl: "in",
    hl: "en",
  };
}

export function buildYoutubeVideoParams(videoId: string) {
  return { engine: "youtube_video", v: videoId };
}

/**
 * Pure SerpApi params for one trends chunk. Carries only API fields;
 * chunkKey/anchor are snapshot metadata attached by fetchGoogleTrends
 * and must never be sent to SerpApi.
 */
export function buildTrendsChunkParams(
  chunk: FetchBrand[],
  index: number,
  scope?: { geo?: string; date?: string },
): Record<string, unknown> {
  void index;
  return {
    engine: "google_trends",
    q: chunk.map((brand) => truncateQuery(brand.name)).join(","),
    geo: scope?.geo ?? TRENDS_GEO,
    date: scope?.date ?? TRENDS_DATE_RANGE,
    data_type: "TIMESERIES",
    cat: TRENDS_CATEGORY_ANCHOR,
  };
}

/**
 * Pure usage shape for runs.ts counters. No database write here.
 * Maps the adapter level credits count onto the runs creditCount field.
 */
export function recordUsage(input: UsageInput): UsageRecord {
  const record: UsageRecord = {
    runId: input.runId,
    engine: input.engine,
    latencyMs: input.latencyMs,
  };
  if (input.credits !== undefined) {
    record.creditCount = input.credits;
  }
  return record;
}

export type EngineFetchOk = {
  status: "ok";
  engine: string;
  runId: string;
  data: unknown;
  queryParams: Record<string, unknown>;
};

export type EngineFetchFailed = {
  status: "failed";
  engine: string;
  runId: string;
  errorMessage: string;
  queryParams: Record<string, unknown>;
};

export type EngineFetchUnavailable = {
  status: "unavailable";
  engine: string;
  runId: string;
  errorMessage: string;
  queryParams: Record<string, unknown>;
};

export type EngineFetchResult =
  | EngineFetchOk
  | EngineFetchFailed
  | EngineFetchUnavailable;

/**
 * Google Search adapter, one brand per call.
 * Paid plus organic results for the India domain in English.
 */
export async function fetchGoogleSearch(
  brand: { name: string },
  runId: string,
  fetchFn: SerpapiFetchFn = serpapiFetch,
): Promise<EngineFetchResult> {
  const queryParams = buildGoogleSearchParams(brand);
  const result = await fetchFn(queryParams);
  if (result.ok) {
    return { status: "ok", engine: "google", runId, data: result.data, queryParams };
  }
  return {
    status: "failed",
    engine: "google",
    runId,
    errorMessage: result.error,
    queryParams,
  };
}

/**
 * Google News adapter, one brand per call. Mirrors fetchGoogleSearch exactly.
 */
export async function fetchGoogleNews(
  brand: { name: string; vertical?: string },
  runId: string,
  fetchFn: SerpapiFetchFn = serpapiFetch,
): Promise<EngineFetchResult> {
  const queryParams = buildGoogleNewsParams(brand);
  const result = await fetchFn(queryParams);
  if (result.ok) {
    return { status: "ok", engine: "google_news", runId, data: result.data, queryParams };
  }
  return {
    status: "failed",
    engine: "google_news",
    runId,
    errorMessage: result.error,
    queryParams,
  };
}

/**
 * Google Ads Transparency Center adapter, one brand per call.
 * When no advertiser ID is stored, no network call is made and the
 * engine reports unavailable so the run can continue without it.
 */
export async function fetchAdsTransparency(
  brand: { adsTransparencyAdvertiserId?: string },
  runId: string,
  fetchFn: SerpapiFetchFn = serpapiFetch,
): Promise<EngineFetchResult> {
  const engine = "google_ads_transparency_center";
  const advertiserId = brand.adsTransparencyAdvertiserId?.trim();
  if (!advertiserId || !ADVERTISER_ID_PATTERN.test(advertiserId)) {
    return {
      status: "unavailable",
      engine,
      runId,
      errorMessage: "adsTransparencyAdvertiserId is not set for this brand",
      queryParams: {},
    };
  }
  const queryParams = buildAdsTransparencyParams(advertiserId);
  const result = await fetchFn(queryParams);
  if (result.ok) {
    return { status: "ok", engine, runId, data: result.data, queryParams };
  }
  return {
    status: "failed",
    engine,
    runId,
    errorMessage: result.error,
    queryParams,
  };
}

function readVideoId(entry: unknown): string | null {
  if (typeof entry !== "object" || entry === null) return null;
  const record = entry as Record<string, unknown>;
  for (const key of ["video_id", "id"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  const link = record["link"];
  if (typeof link === "string") {
    const match = link.match(/[?&]v=([^&#]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

function readVideoResults(data: unknown): unknown[] {
  if (typeof data !== "object" || data === null) return [];
  const results = (data as Record<string, unknown>)["video_results"];
  return Array.isArray(results) ? results : [];
}

/**
 * YouTube Search for one brand. Queries engine youtube with the brand
 * name, gl in, hl en. Returns the top YOUTUBE_VIDEOS_PER_BRAND video ids
 * plus a snapshot payload the caller persists. No database write here.
 */
export async function fetchYoutubeSearch(
  brand: FetchBrand,
  runId: Id<"runs">,
  fetchFn: SerpapiFetchFn = serpapiFetch,
): Promise<YoutubeSearchResult> {
  const queryParams: Record<string, unknown> = buildYoutubeSearchParams(brand);
  const result = await fetchFn(queryParams);
  const fetchedAt = new Date().toISOString();

  if (!result.ok) {
    return {
      videoIds: [],
      snapshot: {
        runId,
        brandId: brand._id,
        engine: "youtube",
        queryParams,
        region: "IN",
        fetchedAt,
        status: "failed",
        errorMessage: result.error,
        claimIds: [],
      },
      latencyMs: result.latencyMs,
    };
  }

  const entries = readVideoResults(result.data);
  const videoIds: string[] = [];
  for (const entry of entries) {
    if (videoIds.length >= YOUTUBE_VIDEOS_PER_BRAND) break;
    const id = readVideoId(entry);
    if (id !== null && !videoIds.includes(id)) videoIds.push(id);
  }

  return {
    videoIds,
    snapshot: {
      runId,
      brandId: brand._id,
      engine: "youtube",
      queryParams,
      region: "IN",
      fetchedAt,
      status: "ok",
      rawResponse: {
        video_results: entries.slice(0, YOUTUBE_VIDEOS_PER_BRAND),
        resultCount: entries.length,
        searchQuery: brand.name,
      },
      claimIds: [],
    },
    latencyMs: result.latencyMs,
    ...(result.credits !== undefined ? { credits: result.credits } : {}),
  };
}

type SettledVideo = {
  videoId: string;
  ok: boolean;
  data?: unknown;
  latencyMs: number;
  credits?: number;
};

/**
 * YouTube Video details for one brand. Fetches every video id in parallel
 * with Promise.allSettled and aggregates the wins into ONE snapshot
 * payload. A partial in engine failure still yields status ok with the
 * successful videos aggregated and the failed ids named in errorMessage.
 * Only when every video fails does the snapshot become failed.
 */
export async function fetchYoutubeVideos(
  brand: FetchBrand,
  videoIds: string[],
  runId: Id<"runs">,
  fetchFn: SerpapiFetchFn = serpapiFetch,
): Promise<YoutubeVideosResult> {
  const fetchedAt = new Date().toISOString();
  const cappedIds = videoIds.slice(0, YOUTUBE_VIDEOS_PER_BRAND);
  const validIds = cappedIds.filter((id) => isValidVideoId(id));
  const invalidIds = cappedIds.filter((id) => !isValidVideoId(id));
  const queryParams: Record<string, unknown> = {
    engine: "youtube_video",
    videos: [...cappedIds],
  };

  if (cappedIds.length === 0) {
    return {
      snapshot: {
        runId,
        brandId: brand._id,
        engine: "youtube_video",
        queryParams,
        region: "IN",
        fetchedAt,
        status: "ok",
        rawResponse: { videos: [] },
        claimIds: [],
      },
      latencyMs: 0,
    };
  }

  const budget = checkFetchBudget(validIds.length);
  if (!budget.ok) {
    return {
      snapshot: {
        runId,
        brandId: brand._id,
        engine: "youtube_video",
        queryParams,
        region: "IN",
        fetchedAt,
        status: "failed",
        errorMessage: budget.error,
        rawResponse: { videos: [] },
        claimIds: [],
      },
      latencyMs: 0,
    };
  }

  const settled = await Promise.allSettled(
    validIds.map(async (videoId): Promise<SettledVideo> => {
      const result = await fetchFn(buildYoutubeVideoParams(videoId));
      if (!result.ok) {
        return { videoId, ok: false, latencyMs: result.latencyMs };
      }
      return {
        videoId,
        ok: true,
        data: result.data,
        latencyMs: result.latencyMs,
        ...(result.credits !== undefined ? { credits: result.credits } : {}),
      };
    }),
  );

  const successes: Array<{ videoId: string; data: unknown }> = [];
  const failedIds: string[] = [...invalidIds];
  let latencyMs = 0;
  let credits: number | undefined;

  settled.forEach((entry, index) => {
    const fallbackId = validIds[index] ?? `index-${index}`;
    if (entry.status === "fulfilled") {
      latencyMs += entry.value.latencyMs;
      if (entry.value.credits !== undefined) {
        credits = (credits ?? 0) + entry.value.credits;
      }
      if (entry.value.ok && entry.value.data !== undefined) {
        successes.push({ videoId: entry.value.videoId, data: entry.value.data });
      } else {
        failedIds.push(entry.value.videoId);
      }
    } else {
      failedIds.push(fallbackId);
    }
  });

  if (successes.length === 0) {
    return {
      snapshot: {
        runId,
        brandId: brand._id,
        engine: "youtube_video",
        queryParams,
        region: "IN",
        fetchedAt,
        status: "failed",
        errorMessage: `all youtube_video fetches failed: ${failedIds.join(", ")}`,
        rawResponse: { videos: [] },
        claimIds: [],
      },
      latencyMs,
      ...(credits !== undefined ? { credits } : {}),
    };
  }

  return {
    snapshot: {
      runId,
      brandId: brand._id,
      engine: "youtube_video",
      queryParams,
      region: "IN",
      fetchedAt,
      status: "ok",
      ...(failedIds.length > 0
        ? { errorMessage: `failed videos: ${failedIds.join(", ")}` }
        : {}),
      rawResponse: { videos: successes },
      claimIds: [],
    },
    latencyMs,
    ...(credits !== undefined ? { credits } : {}),
  };
}

function chunkBrands(brands: FetchBrand[], size: number): FetchBrand[][] {
  const chunks: FetchBrand[][] = [];
  for (let i = 0; i < brands.length; i += size) {
    chunks.push(brands.slice(i, i + size));
  }
  return chunks;
}

export type TrendsTimelineValue = {
  query: string;
  extracted_value: number;
};

export type TrendsTimelinePoint = {
  date: string;
  timestamp?: number;
  values: TrendsTimelineValue[];
};

/** Keep a bounded chart-safe copy without merging values across chunks. */
export function normalizeTrendsTimeline(
  timeline: unknown,
  maxPoints = 400,
): TrendsTimelinePoint[] {
  if (!Array.isArray(timeline) || !Number.isInteger(maxPoints) || maxPoints < 1) {
    return [];
  }
  const out: TrendsTimelinePoint[] = [];
  for (const item of timeline.slice(0, maxPoints)) {
    if (typeof item !== "object" || item === null) continue;
    const entry = item as Record<string, unknown>;
    const date = typeof entry.date === "string" ? entry.date.trim() : "";
    if (date === "" || !Array.isArray(entry.values)) continue;
    const values: TrendsTimelineValue[] = [];
    for (const candidate of entry.values) {
      if (typeof candidate !== "object" || candidate === null) continue;
      const row = candidate as Record<string, unknown>;
      const query = typeof row.query === "string" ? row.query.trim() : "";
      const raw = row.extracted_value ?? row.value;
      const extracted =
        typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
      if (query === "" || !Number.isFinite(extracted)) continue;
      values.push({
        query,
        extracted_value: Math.max(0, Math.min(100, extracted)),
      });
    }
    if (values.length === 0) continue;
    const timestamp =
      typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp)
        ? entry.timestamp
        : undefined;
    out.push({ date, ...(timestamp === undefined ? {} : { timestamp }), values });
  }
  return out;
}

function readTimeline(data: unknown): TrendsTimelinePoint[] {
  if (typeof data !== "object" || data === null) return [];
  const interest = (data as Record<string, unknown>)["interest_over_time"];
  if (typeof interest !== "object" || interest === null) return [];
  const timeline = (interest as Record<string, unknown>)["timeline_data"];
  return normalizeTrendsTimeline(timeline);
}

/**
 * Google Trends for a brand cohort. Chunks the cohort into supported query
 * sizes, repeats the same stable category anchor plus geo IN plus date
 * today 3-m in every chunk, and returns one snapshot per brand per chunk.
 * Each snapshot keeps its chunk key and anchor in queryParams.
 *
 * Cross chunk values never rank absolutely. Trends interest is relative
 * only within the brands queried together, so the UI must present
 * within chunk relative interest or a labelled normalized estimate, never
 * raw values from different chunks as one absolute ranking.
 */
export async function fetchGoogleTrends(
  brands: FetchBrand[],
  runId: Id<"runs">,
  fetchFn: SerpapiFetchFn = serpapiFetch,
  scope?: { geo?: string; date?: string },
): Promise<TrendsFetchResult> {
  if (brands.length === 0) {
    return { snapshots: [], chunkKeys: [], latencyMs: 0 };
  }

  const chunks = chunkBrands(brands, TRENDS_CHUNK_SIZE);
  const budget = checkFetchBudget(chunks.length);
  if (!budget.ok) {
    const fetchedAt = new Date().toISOString();
    return {
      snapshots: brands.map((brand) => ({
        runId,
        brandId: brand._id,
        engine: "google_trends" as const,
        queryParams: {},
        region: scope?.geo ?? TRENDS_GEO,
        fetchedAt,
        status: "failed" as const,
        errorMessage: budget.error,
        claimIds: [],
      })),
      chunkKeys: [],
      latencyMs: 0,
    };
  }

  const snapshots: SnapshotPayload[] = [];
  const chunkKeys: string[] = [];
  let latencyMs = 0;
  let credits: number | undefined;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index] ?? [];
    const chunkKey = `trends-chunk-${index}`;
    chunkKeys.push(chunkKey);
    const apiParams: Record<string, unknown> = buildTrendsChunkParams(
      chunk,
      index,
      scope,
    );
    const queryParams: Record<string, unknown> = {
      ...apiParams,
      chunkKey,
      anchor: TRENDS_CATEGORY_ANCHOR,
    };

    const result = await fetchFn(apiParams);
    const fetchedAt = new Date().toISOString();
    latencyMs += result.latencyMs;
    if (result.ok && result.credits !== undefined) {
      credits = (credits ?? 0) + result.credits;
    }

    if (!result.ok) {
      for (const brand of chunk) {
        snapshots.push({
          runId,
          brandId: brand._id,
          engine: "google_trends",
          queryParams,
          region: scope?.geo ?? TRENDS_GEO,
          fetchedAt,
          status: "failed",
          errorMessage: result.error,
          claimIds: [],
        });
      }
      continue;
    }

    const timeline = readTimeline(result.data);
    const period =
      timeline.length > 0
        ? `${timeline[0]?.date}..${timeline[timeline.length - 1]?.date}`
        : undefined;
    for (const brand of chunk) {
      snapshots.push({
        runId,
        brandId: brand._id,
        engine: "google_trends",
        queryParams,
        region: scope?.geo ?? TRENDS_GEO,
        fetchedAt,
        status: "ok",
        ...(period === undefined ? {} : { period }),
        rawResponse: {
          timeline_data: timeline,
          brands: chunk.map((entry) => entry.name),
          chunkKey,
          anchor: TRENDS_CATEGORY_ANCHOR,
          valueScale: "within_chunk_relative_0_100",
        },
        claimIds: [],
      });
    }
  }

  return {
    snapshots,
    chunkKeys,
    latencyMs,
    ...(credits !== undefined ? { credits } : {}),
  };
}

/**
 * Bounded concurrency pool for N brand fan out.
 * Runs tasks in batches of `limit` with Promise.allSettled per batch,
 * so every task executes and no unbounded Promise.all is ever created.
 * Engine failures travel as status values inside T, never as rejections;
 * a truly thrown error is raised after all batches finish.
 */
export async function runBounded<T>(
  tasks: Array<() => Promise<T>>,
  limit = 3,
): Promise<T[]> {
  const size = Number.isInteger(limit) && limit > 0 ? limit : 3;
  const out: T[] = new Array(tasks.length);
  let hasError = false;
  let firstError: unknown = null;
  for (let i = 0; i < tasks.length; i += size) {
    const chunk = tasks.slice(i, i + size);
    const settled = await Promise.allSettled(chunk.map((task) => task()));
    settled.forEach((entry, index) => {
      if (entry.status === "fulfilled") {
        out[i + index] = entry.value;
      } else if (!hasError) {
        hasError = true;
        firstError = entry.reason;
      }
    });
  }
  if (hasError) {
    throw firstError;
  }
  return out;
}
