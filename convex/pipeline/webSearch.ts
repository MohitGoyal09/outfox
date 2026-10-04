"use node";

import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { requireUserId } from "../lib/auth";
import { serpapiFetch } from "../lib/serpapiClient";
import { fetchSerpApiAccount } from "../lib/serpApiAccount";
import { extractGoogleClaims, countGoogleRelevanceDrops } from "./extractClaims";
import type { ExtractCtx, BrandIdentity } from "./extractClaims";
import { buildCohortKey } from "./brandProfile";
import { WEB_SEARCH_MAX_REQUESTS_PER_CALL } from "./plan";
import type { Coverage } from "../../lib/agentTypes";

/**
 * Real, account-wide floor below which a web_search call refuses to fire.
 * The per-turn counter in app/api/chat/route.ts resets on every POST, so it
 * caps one request, never the account: this checks the actual SerpApi
 * account state (free to read, costs no credits) so a burst of concurrent
 * requests can't drain the plan with each one seeing its own fresh counter.
 */
export const SEARCH_RESERVE_FLOOR = 5;

/**
 * web_search tool: one live SerpApi google search, persisted as real Claim
 * rows so the citation guardrail and the brand evidence page both see them.
 *
 * Per-turn call count (max 2) is enforced by the caller
 * (app/api/chat/route.ts), which has "this turn" as a concept; a Convex
 * action does not. This action enforces the other half of the cap: exactly
 * WEB_SEARCH_MAX_REQUESTS_PER_CALL (1) SerpApi request per call, no fan-out.
 */

const MAX_QUERY_CHARS = 200;
const MAX_RESULT_CLAIMS = 10;

export type WebSearchArgs = { query: string; brandId: string };

export function validateWebSearchArgs(input: {
  query?: unknown;
  brandId?: unknown;
}): { ok: true; value: WebSearchArgs } | { ok: false; error: string } {
  if (typeof input.query !== "string" || input.query.trim() === "") {
    return { ok: false, error: "query must be a non-empty string" };
  }
  if (input.query.trim().length > MAX_QUERY_CHARS) {
    return { ok: false, error: `query must be at most ${MAX_QUERY_CHARS} characters` };
  }
  if (typeof input.brandId !== "string" || input.brandId === "") {
    return { ok: false, error: "brandId must be a non-empty string" };
  }
  return { ok: true, value: { query: input.query.trim(), brandId: input.brandId } };
}

/** Find the newest run for this one-brand cohort, or start one. */
export async function resolveOrCreateRun(
  ctx: Pick<ActionCtx, "runQuery" | "runMutation">,
  brandId: Id<"brands">,
): Promise<Id<"runs">> {
  const cohortKey = buildCohortKey([String(brandId)]);
  const existing = (await ctx.runQuery(api.runs.latestForCohort, { cohortKey })) as
    | Doc<"runs">
    | null;
  if (existing !== null) return existing._id;
  return (await ctx.runMutation(api.runs.createRun, {
    cohortKey,
    brandIds: [brandId],
    mode: "live" as const,
    refreshAuthorized: true,
  })) as Id<"runs">;
}

const webSearchClaimValidator = v.object({
  id: v.string(),
  text: v.string(),
  metric: v.optional(v.string()),
  value: v.optional(v.union(v.string(), v.number())),
  evidenceUrl: v.string(),
});

const webSearchCoverageValidator = v.record(
  v.string(),
  v.union(v.literal("ok"), v.literal("missing"), v.literal("stale")),
);

/**
 * web_search's tool contract, per docs/specs/agent-redesign.md section 3:
 * every tool returns { rows, total, coverage, asOf }. `ok`/`error`/`runId`/
 * `requestCount` stay alongside it -- they are this tool's own live-call
 * bookkeeping (spend, which run the snapshot landed on), not part of the
 * shared envelope, and existing callers (refreshTrends.ts's sibling
 * pattern) don't touch this shape.
 */
export const webSearch = action({
  args: { query: v.string(), brandId: v.id("brands") },
  returns: v.union(
    v.object({
      ok: v.literal(false),
      error: v.string(),
      runId: v.string(),
      requestCount: v.number(),
      rows: v.array(webSearchClaimValidator),
      total: v.number(),
      coverage: webSearchCoverageValidator,
      asOf: v.union(v.string(), v.null()),
      droppedIrrelevantCount: v.number(),
    }),
    v.object({
      ok: v.literal(true),
      runId: v.string(),
      requestCount: v.number(),
      rows: v.array(webSearchClaimValidator),
      total: v.number(),
      coverage: webSearchCoverageValidator,
      asOf: v.union(v.string(), v.null()),
      droppedIrrelevantCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const parsed = validateWebSearchArgs(args);
    if (!parsed.ok) throw new ConvexError(parsed.error);

    const brand = (await ctx.runQuery(api.brands.getBrand, {
      brandId: args.brandId,
    })) as Doc<"brands"> | null;
    if (brand === null) throw new ConvexError("brand not found");

    const account = await fetchSerpApiAccount();
    if (account.ok && account.data.totalSearchesLeft <= SEARCH_RESERVE_FLOOR) {
      throw new ConvexError(
        `web_search refused: only ${account.data.totalSearchesLeft} SerpApi searches left this account, below the ${SEARCH_RESERVE_FLOOR}-search reserve floor`,
      );
    }

    const runId = await resolveOrCreateRun(ctx, args.brandId);
    const fetchedAt = new Date().toISOString();
    const queryParams = {
      engine: "google",
      q: parsed.value.query,
      gl: "in",
      hl: "en",
      google_domain: "google.co.in",
    };

    // Exactly WEB_SEARCH_MAX_REQUESTS_PER_CALL (1) live request, ever, per call.
    const result = await serpapiFetch(queryParams);

    const snapshotId = await ctx.runMutation(internal.snapshots.insertSnapshot, {
      runId,
      brandId: args.brandId,
      engine: "google",
      queryParams,
      region: "IN",
      fetchedAt,
      status: result.ok ? "ok" : "failed",
      claimIds: [],
      ...(result.ok ? {} : { errorMessage: result.error }),
      ...(result.ok ? { rawResponse: result.data } : {}),
    });

    if (!result.ok) {
      return {
        ok: false as const,
        error: result.error,
        runId: String(runId),
        requestCount: WEB_SEARCH_MAX_REQUESTS_PER_CALL,
        rows: [],
        total: 0,
        coverage: { google: "missing" } as Coverage,
        asOf: null,
        droppedIrrelevantCount: 0,
      };
    }

    const extractCtx: ExtractCtx = {
      runId,
      snapshotId,
      brandId: args.brandId,
      query: parsed.value.query,
      fetchedAt,
    };
    // Deterministic relevance gate: web_search's query is free text the
    // model chooses, unlike the brand-scoped fetchGoogleSearch pipeline, so
    // an off-topic Google result (e.g. a "discount" dictionary definition
    // for a "<brand> discount hooks" query) must never reach the claims
    // table. See extractClaims.ts's isRelevantToBrand for the rule.
    const brandIdentity: BrandIdentity = {
      name: brand.name,
      aliases: brand.aliases,
      domain: brand.domain,
      searchTerm: brand.searchTerm,
    };
    const droppedIrrelevantCount = countGoogleRelevanceDrops(result.data, brandIdentity);
    const extracted = extractGoogleClaims(result.data, extractCtx, brandIdentity).slice(
      0,
      MAX_RESULT_CLAIMS,
    );
    const claimIds = (await ctx.runMutation(internal.claims.insertClaims, {
      claims: extracted,
    })) as Id<"claims">[];
    await ctx.runMutation(internal.snapshots.setClaimIdsInternal, {
      snapshotId,
      claimIds,
    });

    const rows = extracted.map((claim, index) => ({
      id: String(claimIds[index]),
      text: claim.text,
      metric: claim.metric,
      value: claim.value,
      evidenceUrl: claim.evidenceUrl,
    }));
    return {
      ok: true as const,
      runId: String(runId),
      requestCount: WEB_SEARCH_MAX_REQUESTS_PER_CALL,
      rows,
      total: rows.length,
      coverage: { google: "ok" } as Coverage,
      asOf: fetchedAt,
      droppedIrrelevantCount,
    };
  },
});
