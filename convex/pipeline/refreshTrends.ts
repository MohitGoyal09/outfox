"use node";

import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { requireUserId } from "../lib/auth";
import { fetchSerpApiAccount } from "../lib/serpApiAccount";
import { fetchGoogleTrends } from "./fetchEngines";
import { extractTrendsClaims } from "./extractClaims";
import type { ExtractCtx } from "./extractClaims";
import { resolveOrCreateRun, SEARCH_RESERVE_FLOOR } from "./webSearch";

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function stringOf(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const trendsClaimValidator = v.object({
  id: v.string(),
  text: v.string(),
  metric: v.optional(v.string()),
  value: v.optional(v.union(v.string(), v.number())),
  evidenceUrl: v.string(),
});

/**
 * Scoped, single-brand Trends refresh for one geo/date combination.
 * Mirrors webSearch's shape (one live SerpApi call, real budget floor,
 * persisted snapshot + claims) instead of runComparison's full six-engine
 * fan-out — switching the Trends geography filter should cost one Trends
 * call, not a whole-cohort live run.
 */
export const refreshTrends = action({
  args: { brandId: v.id("brands"), geo: v.string(), date: v.string() },
  returns: v.union(
    v.object({ ok: v.literal(false), error: v.string() }),
    v.object({
      ok: v.literal(true),
      runId: v.string(),
      snapshotId: v.string(),
      region: v.string(),
      claims: v.array(trendsClaimValidator),
    }),
  ),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const brand = (await ctx.runQuery(api.brands.getBrand, {
      brandId: args.brandId,
    })) as Doc<"brands"> | null;
    if (brand === null) throw new ConvexError("brand not found");

    const account = await fetchSerpApiAccount();
    if (account.ok && account.data.totalSearchesLeft <= SEARCH_RESERVE_FLOOR) {
      throw new ConvexError(
        `refresh_trends refused: only ${account.data.totalSearchesLeft} SerpApi searches left this account, below the ${SEARCH_RESERVE_FLOOR}-search reserve floor`,
      );
    }

    const runId = await resolveOrCreateRun(ctx, args.brandId);
    const fetchedAt = new Date().toISOString();

    const result = await fetchGoogleTrends([{ _id: brand._id, name: brand.name }], runId, undefined, {
      geo: args.geo,
      date: args.date,
    });
    const snapshot = result.snapshots[0];
    if (snapshot === undefined) {
      return { ok: false as const, error: "Google Trends returned no snapshot for this brand." };
    }

    const snapshotId = (await ctx.runMutation(internal.snapshots.insertSnapshot, {
      runId,
      brandId: args.brandId,
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

    if (snapshot.status !== "ok") {
      return {
        ok: false as const,
        error: snapshot.errorMessage ?? "Google Trends fetch failed.",
      };
    }

    const params = recordOf(snapshot.queryParams) ?? {};
    const raw = recordOf(snapshot.rawResponse);
    const timeline = raw?.["timeline_data"] ?? [];
    const chunkKey = stringOf(params["chunkKey"]) ?? "trends-chunk-0";
    const anchor = stringOf(params["anchor"]) ?? "0";
    const extractCtx: ExtractCtx = {
      runId,
      snapshotId,
      brandId: args.brandId,
      query: brand.name,
      fetchedAt,
    };
    const extracted = extractTrendsClaims(timeline, brand.name, chunkKey, anchor, extractCtx);
    const claimIds = (await ctx.runMutation(internal.claims.insertClaims, {
      claims: extracted,
    })) as Id<"claims">[];
    await ctx.runMutation(internal.snapshots.setClaimIdsInternal, {
      snapshotId,
      claimIds,
    });

    return {
      ok: true as const,
      runId: String(runId),
      snapshotId: String(snapshotId),
      region: snapshot.region,
      claims: extracted.map((claim, index) => ({
        id: String(claimIds[index]),
        text: claim.text,
        metric: claim.metric,
        value: claim.value,
        evidenceUrl: claim.evidenceUrl,
      })),
    };
  },
});
