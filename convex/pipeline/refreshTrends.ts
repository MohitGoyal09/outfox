"use node";

import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { requireUserId } from "../lib/auth";
import { fetchSerpApiAccount } from "../lib/serpApiAccount";
import { fetchGoogleTrends } from "./fetchEngines";
import { extractTrendsClaims } from "./extractClaims";
import type { ExtractCtx } from "./extractClaims";
import { SEARCH_RESERVE_FLOOR } from "./webSearch";
import { buildCohortKey } from "./brandProfile";

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
/**
 * One shape for both callers, so the public gate and the internal repair path
 * can never drift apart.
 */
const refreshTrendsReturns = v.union(
  v.object({ ok: v.literal(false), error: v.string() }),
  v.object({
    ok: v.literal(true),
    runId: v.string(),
    snapshotId: v.string(),
    region: v.string(),
    claims: v.array(trendsClaimValidator),
  }),
);

/**
 * The annotation is required, not decoration: `refreshTrends` delegates to
 * `refreshTrendsInternal` in the SAME file, so without an explicit return type
 * TypeScript cannot infer either one ("referenced directly or indirectly in its
 * own initializer") and both become `any`.
 */
export type RefreshTrendsResult =
  | { ok: false; error: string }
  | {
      ok: true;
      runId: string;
      snapshotId: string;
      region: string;
      claims: Array<{
        id: string;
        text: string;
        metric?: string;
        value?: string | number;
        evidenceUrl: string;
      }>;
    };

/**
 * The work, with no auth of its own. Reachable only from the public action below
 * or from the Convex CLI, never from a client.
 *
 * Exists because the public action MUST have a user (it is a user's action), which
 * made this impossible to run from `npx convex run` for a data repair. Verified
 * 2026-09-23: needs it for brands whose Trends evidence predates per-point
 * extraction, where `get_trends` returns nothing at all because
 * `selectTrends` filters to the point metric and only averages exist.
 */
export const refreshTrendsInternal = internalAction({
  args: { brandId: v.id("brands"), geo: v.string(), date: v.string() },
  returns: refreshTrendsReturns,
  handler: async (ctx, args): Promise<RefreshTrendsResult> => {
    const brand = (await ctx.runQuery(internal.brands.getBrandInternal, {
      brandId: args.brandId,
    })) as Doc<"brands"> | null;
    if (brand === null) throw new ConvexError("brand not found");

    const account = await fetchSerpApiAccount();
    if (account.ok && account.data.totalSearchesLeft <= SEARCH_RESERVE_FLOOR) {
      throw new ConvexError(
        `refresh_trends refused: only ${account.data.totalSearchesLeft} SerpApi searches left this account, below the ${SEARCH_RESERVE_FLOOR}-search reserve floor`,
      );
    }

    // Resolved without auth on purpose: this path runs from the Convex CLI. The
    // public action has already authenticated the human before delegating.
    const cohortKey = buildCohortKey([String(args.brandId)]);
    const existingRun = (await ctx.runQuery(internal.runs.latestForCohortInternal, {
      cohortKey,
    })) as Doc<"runs"> | null;
    const runId =
      existingRun?._id ??
      ((await ctx.runMutation(internal.runs.internalCreateRun, {
        cohortKey,
        brandIds: [args.brandId],
        mode: "live" as const,
        ownerId: brand.ownerId,
      })) as Id<"runs">);
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

/**
 * The user-facing action: authenticate, then delegate. The auth check lives here
 * and only here, so the work itself stays callable for data repair without ever
 * becoming callable without a user from a client.
 */
export const refreshTrends = action({
  args: { brandId: v.id("brands"), geo: v.string(), date: v.string() },
  returns: refreshTrendsReturns,
  handler: async (ctx, args): Promise<RefreshTrendsResult> => {
    await requireUserId(ctx);
    return await ctx.runAction(internal.pipeline.refreshTrends.refreshTrendsInternal, args);
  },
});
