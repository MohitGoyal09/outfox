"use node";

import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { requireUserId } from "../lib/auth";
import { fetchSerpApiAccount } from "../lib/serpApiAccount";
import {
  fetchGoogleSearch,
  fetchGoogleNews,
  fetchAdsTransparency,
  fetchYoutubeSearch,
  fetchYoutubeVideos,
  fetchGoogleTrends,
} from "./fetchEngines";
import type { EngineFetchResult } from "./fetchEngines";
import {
  extractGoogleClaims,
  extractGoogleNewsClaims,
  extractAdsTransparencyClaims,
  extractYoutubeSearchClaims,
  extractYoutubeVideoResultClaims,
  extractYoutubeVideoClaims,
  extractTrendsClaims,
} from "./extractClaims";
import type { ExtractCtx, ExtractedClaim } from "./extractClaims";
import { buildCohortKey } from "./brandProfile";
import { matchBrandQuery } from "../lib/brandMatch";
import { deriveDomainFromGoogleResults } from "../lib/brandDomain";
import { SEARCH_RESERVE_FLOOR } from "./webSearch";
import { YOUTUBE_VIDEO_DETAIL_COUNT } from "../../lib/constants";
import type { Coverage, Engine } from "../../lib/agentTypes";

/**
 * fetch_brand: the escape hatch for a brand absent from the catalog.
 *
 * Not a refresh -- it refuses any name that already resolves to a tracked
 * brand (matchBrandQuery, same matcher resolve_brand uses) and points the
 * caller at the dashboard refresh button instead. `convex/pipeline/
 * fetchEngines.ts` is reused as-is for every live call; this file adds no
 * new SerpApi adapters, it only chooses which of the existing ones to call
 * and persists the result through the existing claims/snapshots/runs
 * internal mutations.
 *
 * The `brands` and `claims` tables both require a real owning `brands._id`
 * (convex/schema.ts, not owned by this track), so a claim cannot be
 * persisted without one. fetch_brand therefore creates a minimal `brands`
 * row for the new name -- domain and vertical are not part of this tool's
 * args, so both are stored as explicit placeholders. Whether/how the UI
 * promotes this into a fully tracked brand (the "track chip" in
 * docs/specs/agent-redesign.md section 10) is a UI-track concern.
 */

const FETCH_BRAND_ENGINES: ReadonlySet<string> = new Set([
  "google",
  "google_news",
  "google_ads_transparency_center",
  "youtube",
  "google_trends",
]);
const MAX_FETCH_BRAND_ENGINES = 5;
const PLACEHOLDER_VERTICAL = "unknown";

export type FetchBrandArgs = { name: string; engines: string[] };

export function validateFetchBrandArgs(input: {
  name?: unknown;
  engines?: unknown;
}): { ok: true; value: FetchBrandArgs } | { ok: false; error: string } {
  if (typeof input.name !== "string" || input.name.trim() === "") {
    return { ok: false, error: "name must be a non-empty string" };
  }
  if (input.name.trim().length > 200) {
    return { ok: false, error: "name must be at most 200 characters" };
  }
  if (!Array.isArray(input.engines) || input.engines.length === 0) {
    return { ok: false, error: "engines must be a non-empty array" };
  }
  if (input.engines.length > MAX_FETCH_BRAND_ENGINES) {
    return { ok: false, error: `engines must have at most ${MAX_FETCH_BRAND_ENGINES} entries` };
  }
  if (!input.engines.every((e): e is string => typeof e === "string")) {
    return { ok: false, error: "engines must be an array of strings" };
  }
  const unique = new Set(input.engines);
  if (unique.size !== input.engines.length) {
    return { ok: false, error: "engines must not contain duplicates" };
  }
  const bad = input.engines.filter((e) => !FETCH_BRAND_ENGINES.has(e));
  if (bad.length > 0) {
    return { ok: false, error: `engines has unknown values: ${bad.join(", ")}` };
  }
  return { ok: true, value: { name: input.name.trim(), engines: input.engines } };
}

/** Domain is not one of this tool's args; store an explicit, greppable placeholder. */
function placeholderDomain(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "brand"}.unresolved`;
}

const fetchedClaimValidator = v.object({
  id: v.string(),
  /** Absent in `mode: "read"` -- a read creates no brand for a claim to belong to. */
  brandId: v.optional(v.string()),
  text: v.string(),
  metric: v.optional(v.string()),
  value: v.optional(v.union(v.string(), v.number())),
  period: v.optional(v.string()),
  sourceEngine: v.string(),
  evidenceUrl: v.string(),
  fetchedAt: v.string(),
});

const coverageValidator = v.record(
  v.string(),
  v.union(v.literal("ok"), v.literal("missing"), v.literal("stale")),
);

function toRow(id: Id<"claims">, claim: ExtractedClaim) {
  return {
    id: String(id),
    brandId: String(claim.brandId),
    text: claim.text,
    ...(claim.metric !== undefined ? { metric: claim.metric } : {}),
    ...(claim.value !== undefined ? { value: claim.value } : {}),
    ...(claim.period !== undefined ? { period: claim.period } : {}),
    sourceEngine: claim.sourceEngine,
    evidenceUrl: claim.evidenceUrl,
    fetchedAt: claim.fetchedAt,
  };
}

async function persist(
  ctx: Pick<ActionCtx, "runMutation">,
  claims: ExtractedClaim[],
): Promise<Id<"claims">[]> {
  if (claims.length === 0) return [];
  return await ctx.runMutation(internal.claims.insertClaims, { claims });
}

export const fetchBrand = action({
  args: {
    name: v.string(),
    engines: v.array(v.string()),
    /**
     * `"read"` fetches the web and returns rows for this turn only: no brand, no
     * run, no snapshot, no claim. `"add"` runs the real ingest pipeline, which is
     * the only way to get durable, citable evidence for a brand outside the
     * catalog.
     *
     * Two agent tools sit on this one action (`fetch_brand`, `add_brand`) so each
     * tool has one job. The branch below is the whole difference between them.
     */
    mode: v.union(v.literal("read"), v.literal("add")),
  },
  returns: v.union(
    v.object({
      ok: v.literal(false),
      refused: v.literal(true),
      reason: v.string(),
      existingBrandId: v.string(),
      existingBrandName: v.string(),
    }),
    v.object({
      ok: v.literal(true),
      mode: v.union(v.literal("read"), v.literal("add")),
      /** Absent in `mode: "read"`. */
      brandId: v.optional(v.string()),
      brandName: v.string(),
      rows: v.array(fetchedClaimValidator),
      total: v.number(),
      coverage: coverageValidator,
      asOf: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const parsed = validateFetchBrandArgs(args);
    if (!parsed.ok) throw new ConvexError(parsed.error);
    const { name, engines } = parsed.value;

    const ownedBrands = (await ctx.runQuery(api.brands.listBrands, {})) as Doc<"brands">[];
    const matches = matchBrandQuery(name, ownedBrands);
    if (matches.length > 0) {
      const top = matches[0]!;
      return {
        ok: false as const,
        refused: true as const,
        reason:
          `"${name}" already resolves to a tracked brand ("${top.brandName}"). ` +
          "fetch_brand never re-fetches a tracked brand -- use the dashboard refresh button instead.",
        existingBrandId: top.brandId,
        existingBrandName: top.brandName,
      };
    }

    const account = await fetchSerpApiAccount();
    if (account.ok && account.data.totalSearchesLeft <= SEARCH_RESERVE_FLOOR) {
      throw new ConvexError(
        `fetch_brand refused: only ${account.data.totalSearchesLeft} SerpApi searches left this account, below the ${SEARCH_RESERVE_FLOOR}-search reserve floor`,
      );
    }

    // -----------------------------------------------------------------------
    // mode "read": fetch the web and return rows. Nothing is written -- no
    // brand, no run, no snapshot, no claim. Placeholder ids below exist only so
    // the existing extract functions can be reused; they never reach a document.
    // -----------------------------------------------------------------------
    if (args.mode === "read") {
      const readFetchedAt = new Date().toISOString();
      const readBrand = {
        _id: "webfetch" as unknown as Id<"brands">,
        name,
      };
      const readCtx = (engine: string): ExtractCtx => ({
        runId: "webfetch" as unknown as Id<"runs">,
        snapshotId: `webfetch-${engine}` as unknown as Id<"snapshots">,
        brandId: readBrand._id,
        query: name,
        fetchedAt: readFetchedAt,
      });
      const readCoverage: Coverage = {};
      const readRows: Array<{
        id: string;
        text: string;
        metric?: string;
        value?: string | number;
        period?: string;
        sourceEngine: string;
        evidenceUrl: string;
        fetchedAt: string;
      }> = [];
      const collect = (engine: Engine, claims: ExtractedClaim[]): void => {
        readCoverage[engine] = claims.length > 0 ? "ok" : "missing";
        claims.forEach((claim, index) => {
          readRows.push({
            // Never a Convex id: this row is not stored anywhere. Stable within
            // the turn so the thread ledger can key it.
            id: `webfetch:${engine}:${index}`,
            text: claim.text,
            ...(claim.metric !== undefined ? { metric: claim.metric } : {}),
            ...(claim.value !== undefined ? { value: claim.value } : {}),
            ...(claim.period !== undefined ? { period: claim.period } : {}),
            sourceEngine: claim.sourceEngine,
            evidenceUrl: claim.evidenceUrl,
            fetchedAt: claim.fetchedAt,
          });
        });
      };
      const engineSet = new Set(engines);

      if (engineSet.has("google")) {
        const result = await fetchGoogleSearch({ name }, "webfetch");
        collect(
          "google",
          result.status === "ok" ? extractGoogleClaims(result.data, readCtx("google"), readBrand) : [],
        );
      }
      if (engineSet.has("google_news")) {
        const result = await fetchGoogleNews({ name }, "webfetch");
        collect(
          "google_news",
          result.status === "ok" ? extractGoogleNewsClaims(result.data, readCtx("google_news")) : [],
        );
      }
      if (engineSet.has("google_ads_transparency_center")) {
        // Without an advertiserId this engine has nothing to read; the ingest
        // path reports the same. No snapshot is written here either way.
        readCoverage.google_ads_transparency_center = "missing";
      }
      if (engineSet.has("youtube")) {
        const search = await fetchYoutubeSearch(readBrand, "webfetch" as unknown as Id<"runs">);
        const searchRaw = search.snapshot.rawResponse ?? { video_results: [] };
        collect(
          "youtube",
          search.snapshot.status === "ok"
            ? extractYoutubeSearchClaims(searchRaw, readCtx("youtube"))
            : [],
        );
      }
      if (engineSet.has("google_trends")) {
        const trends = await fetchGoogleTrends(
          [{ _id: readBrand._id, name }],
          "webfetch" as unknown as Id<"runs">,
        );
        for (const [index, snapshot] of trends.snapshots.entries()) {
          const engine = "google_trends";
          const params = (snapshot.queryParams ?? {}) as Record<string, unknown>;
          const raw = snapshot.rawResponse as Record<string, unknown> | undefined;
          const timeline = raw?.timeline_data ?? [];
          const chunkKey = typeof params.chunkKey === "string" ? params.chunkKey : "trends-chunk-0";
          const anchor = typeof params.anchor === "string" ? params.anchor : "0";
          const claims =
            snapshot.status === "ok"
              ? extractTrendsClaims(timeline, name, chunkKey, anchor, readCtx(engine))
              : [];
          if (claims.length === 0) {
            readCoverage[engine] = "missing";
            continue;
          }
          readCoverage[engine] = "ok";
          claims.forEach((claim, i) => {
            readRows.push({
              id: `webfetch:${engine}:${index}-${i}`,
              text: claim.text,
              ...(claim.metric !== undefined ? { metric: claim.metric } : {}),
              ...(claim.value !== undefined ? { value: claim.value } : {}),
              ...(claim.period !== undefined ? { period: claim.period } : {}),
              sourceEngine: claim.sourceEngine,
              evidenceUrl: claim.evidenceUrl,
              fetchedAt: claim.fetchedAt,
            });
          });
        }
      }

      return {
        ok: true as const,
        mode: "read" as const,
        brandName: name,
        rows: readRows,
        total: readRows.length,
        coverage: readCoverage,
        asOf: readFetchedAt,
      };
    }

  // -----------------------------------------------------------------------
    // mode "add": the real ingest pipeline. Unchanged.
    // -----------------------------------------------------------------------
    const brandId = (await ctx.runMutation(internal.brands.createBrandInternal, {
      ownerId,
      name,
      domain: placeholderDomain(name),
      vertical: PLACEHOLDER_VERTICAL,
      aliases: [],
    })) as Id<"brands">;

    const cohortKey = buildCohortKey([String(brandId)]);
    const runId = (await ctx.runMutation(internal.runs.internalCreateRun, {
      cohortKey,
      brandIds: [brandId],
      mode: "live" as const,
      ownerId,
    })) as Id<"runs">;

    const fetchedAt = new Date().toISOString();
    /**
     * Starts as the bare name and gains a real domain once the Google results
     * reveal it (below). The domain is what lets `isRelevantToBrand` separate the
     * brand from a same-named thing: verified live 2026-09-23, "Plum" ingested
     * nutrition videos about the fruit while the domain was a placeholder.
     */
    let brand: { _id: Id<"brands">; name: string; domain?: string } = { _id: brandId, name };
    const engineSet = new Set(engines);
    const coverage: Coverage = {};
    const rows: ReturnType<typeof toRow>[] = [];

    /** Persist claims, then append their real ids paired with each claim to `rows`. */
    async function persistRows(claims: ExtractedClaim[]): Promise<Id<"claims">[]> {
      const ids = await persist(ctx, claims);
      claims.forEach((claim, index) => {
        const id = ids[index];
        if (id !== undefined) rows.push(toRow(id, claim));
      });
      return ids;
    }

    async function storeEngine(
      engine: "google" | "google_news" | "google_ads_transparency_center",
      fetchFn: EngineFetchResult,
      extract: (snapshotId: Id<"snapshots">, ctxIn: ExtractCtx) => ExtractedClaim[],
      captureRawResponse = false,
    ): Promise<void> {
      const status =
        fetchFn.status === "ok" ? "ok" : fetchFn.status === "unavailable" ? "unavailable" : "failed";
      const snapshotId = (await ctx.runMutation(internal.snapshots.insertSnapshot, {
        runId,
        brandId,
        engine,
        queryParams: fetchFn.queryParams,
        region: "IN",
        fetchedAt,
        status,
        claimIds: [],
        ...(fetchFn.status === "ok" ? {} : { errorMessage: fetchFn.errorMessage }),
        ...(captureRawResponse && fetchFn.status === "ok" ? { rawResponse: fetchFn.data } : {}),
      })) as Id<"snapshots">;
      const extractCtx: ExtractCtx = { runId, snapshotId, brandId, query: name, fetchedAt };
      const claims = status === "ok" ? extract(snapshotId, extractCtx) : [];
      const claimIds = await persistRows(claims);
      await ctx.runMutation(internal.snapshots.setClaimIdsInternal, { snapshotId, claimIds });
      coverage[engine] = status === "ok" ? "ok" : "missing";
    }

    if (engineSet.has("google")) {
      const result = await fetchGoogleSearch({ name }, String(runId));
      // Derive the real domain BEFORE extracting, so the very first batch of
      // claims is filtered against it rather than after the damage is stored.
      if (result.status === "ok") {
        const derived = deriveDomainFromGoogleResults(name, result.data);
        if (derived !== null) {
          await ctx.runMutation(internal.brands.setBrandDomainInternal, { brandId, domain: derived });
          brand = { _id: brandId, name, domain: derived };
        }
      }
      await storeEngine("google", result, (_sid, ctxIn) =>
        extractGoogleClaims(
          result.status === "ok" ? result.data : {},
          ctxIn,
          // Filter only when a domain was found: without one, name-only matching
          // is the looser behaviour the other callers already rely on.
          brand.domain !== undefined ? { name, aliases: [], domain: brand.domain } : undefined,
        ),
      );
    }

    if (engineSet.has("google_news")) {
      const result = await fetchGoogleNews({ name }, String(runId));
      await storeEngine(
        "google_news",
        result,
        (_sid, ctxIn) => extractGoogleNewsClaims(result.status === "ok" ? result.data : {}, ctxIn),
        true,
      );
    }

    if (engineSet.has("google_ads_transparency_center")) {
      // No advertiserId is known for a brand outside the catalog; this
      // engine always reports unavailable here, same as the existing
      // fetchAdsTransparency contract when adsTransparencyAdvertiserId is
      // unset.
      const result = await fetchAdsTransparency({}, String(runId));
      await storeEngine("google_ads_transparency_center", result, (_sid, ctxIn) =>
        extractAdsTransparencyClaims(result.status === "ok" ? result.data : {}, ctxIn),
      );
    }

    if (engineSet.has("youtube")) {
      const search = await fetchYoutubeSearch(brand, runId);
      const searchRaw = search.snapshot.rawResponse ?? { video_results: [] };
      const searchStatus = search.snapshot.status;
      const searchSnapshotId = (await ctx.runMutation(internal.snapshots.insertSnapshot, {
        runId,
        brandId,
        engine: "youtube",
        queryParams: search.snapshot.queryParams,
        region: "IN",
        fetchedAt,
        status: searchStatus,
        claimIds: [],
        ...(search.snapshot.errorMessage !== undefined
          ? { errorMessage: search.snapshot.errorMessage }
          : {}),
        rawResponse: searchRaw,
      })) as Id<"snapshots">;
      const searchExtractCtx: ExtractCtx = {
        runId,
        snapshotId: searchSnapshotId,
        brandId,
        query: name,
        fetchedAt,
      };
      const searchClaims =
        searchStatus === "ok"
          ? [
              ...extractYoutubeSearchClaims(searchRaw, searchExtractCtx),
              ...extractYoutubeVideoResultClaims(searchRaw, searchExtractCtx),
            ]
          : [];
      const searchIds = await persistRows(searchClaims);
      await ctx.runMutation(internal.snapshots.setClaimIdsInternal, {
        snapshotId: searchSnapshotId,
        claimIds: searchIds,
      });
      coverage.youtube = searchStatus === "ok" ? "ok" : "missing";

      if (searchStatus === "ok" && search.videoIds.length > 0) {
        const videoIds = search.videoIds.slice(0, YOUTUBE_VIDEO_DETAIL_COUNT);
        const videos = await fetchYoutubeVideos(brand, videoIds, runId);
        const videoStatus = videos.snapshot.status;
        const videoSnapshotId = (await ctx.runMutation(internal.snapshots.insertSnapshot, {
          runId,
          brandId,
          engine: "youtube_video",
          queryParams: videos.snapshot.queryParams,
          region: "IN",
          fetchedAt,
          status: videoStatus,
          claimIds: [],
          ...(videos.snapshot.errorMessage !== undefined
            ? { errorMessage: videos.snapshot.errorMessage }
            : {}),
          ...(videos.snapshot.rawResponse !== undefined
            ? { rawResponse: videos.snapshot.rawResponse }
            : {}),
        })) as Id<"snapshots">;
        const videoExtractCtx: ExtractCtx = {
          runId,
          snapshotId: videoSnapshotId,
          brandId,
          query: name,
          fetchedAt,
        };
        const rawVideos = (videos.snapshot.rawResponse as { videos?: unknown[] } | undefined)?.videos;
        const videoList = Array.isArray(rawVideos) ? rawVideos : [];
        let videoClaims: ExtractedClaim[] = [];
        for (const item of videoList) {
          const row = item as Record<string, unknown> | null;
          const videoId = typeof row?.videoId === "string" ? row.videoId : "";
          if (videoId === "") continue;
          videoClaims = videoClaims.concat(
            extractYoutubeVideoClaims(row?.data ?? {}, videoId, videoExtractCtx).filter(
              (claim) => claim.metric === "youtube_video_like_count",
            ),
          );
        }
        const videoClaimIds = await persistRows(videoClaims);
        await ctx.runMutation(internal.snapshots.setClaimIdsInternal, {
          snapshotId: videoSnapshotId,
          claimIds: videoClaimIds,
        });
        coverage.youtube_video = videoStatus === "ok" ? "ok" : "missing";
      } else {
        coverage.youtube_video = "missing";
      }
    }

    if (engineSet.has("google_trends")) {
      const trends = await fetchGoogleTrends([{ _id: brandId, name }], runId);
      const snapshot = trends.snapshots[0];
      if (snapshot !== undefined) {
        const trendSnapshotId = (await ctx.runMutation(internal.snapshots.insertSnapshot, {
          runId,
          brandId,
          engine: "google_trends",
          queryParams: snapshot.queryParams,
          region: snapshot.region,
          fetchedAt,
          status: snapshot.status,
          claimIds: [],
          ...(snapshot.errorMessage !== undefined ? { errorMessage: snapshot.errorMessage } : {}),
          ...(snapshot.period !== undefined ? { period: snapshot.period } : {}),
          ...(snapshot.rawResponse !== undefined ? { rawResponse: snapshot.rawResponse } : {}),
        })) as Id<"snapshots">;
        const params = (snapshot.queryParams ?? {}) as Record<string, unknown>;
        const raw = snapshot.rawResponse as Record<string, unknown> | undefined;
        const timeline = raw?.timeline_data ?? [];
        const chunkKey = typeof params.chunkKey === "string" ? params.chunkKey : "trends-chunk-0";
        const anchor = typeof params.anchor === "string" ? params.anchor : "0";
        const trendExtractCtx: ExtractCtx = {
          runId,
          snapshotId: trendSnapshotId,
          brandId,
          query: name,
          fetchedAt,
        };
        const trendClaims =
          snapshot.status === "ok"
            ? extractTrendsClaims(timeline, name, chunkKey, anchor, trendExtractCtx)
            : [];
        const trendIds = await persistRows(trendClaims);
        await ctx.runMutation(internal.snapshots.setClaimIdsInternal, {
          snapshotId: trendSnapshotId,
          claimIds: trendIds,
        });
        coverage.google_trends = snapshot.status === "ok" ? "ok" : "missing";
      } else {
        coverage.google_trends = "missing";
      }
    }

    const anyOk = Object.values(coverage).some((status) => status === "ok");
    await ctx.runMutation(internal.runs.internalCloseRun, {
      runId,
      status: anyOk ? "complete" : "failed",
    });
    await ctx.runMutation(internal.brands.updateBrandStatusInternal, {
      brandId,
      ownerId,
      profileStatus: anyOk ? "ready" : "needs_confirmation",
      ...(anyOk ? { lastRefreshedAt: fetchedAt } : {}),
    });

    return {
      ok: true as const,
      mode: "add" as const,
      brandId: String(brandId),
      brandName: name,
      rows,
      total: rows.length,
      coverage,
      asOf: fetchedAt,
    };
  },
});
