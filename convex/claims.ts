import { internalMutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireUserId } from "./lib/auth";
import { MAX_BRANDS_PER_RUN } from "./pipeline/plan";
import { isRelevantToBrand } from "./pipeline/extractClaims";

const sourceEngine = v.union(
  v.literal("google"),
  v.literal("google_ads_transparency_center"),
  v.literal("youtube"),
  v.literal("youtube_video"),
  v.literal("google_trends"),
  v.literal("google_news"),
  v.literal("llm_tag"),
);

const funnelStage = v.union(
  v.literal("unaware"),
  v.literal("problem_aware"),
  v.literal("solution_aware"),
  v.literal("product_aware"),
  v.literal("most_aware"),
  v.literal("not_applicable"),
);

const claimFields = {
  text: v.string(),
  metric: v.optional(v.string()),
  value: v.optional(v.union(v.string(), v.number())),
  unit: v.optional(v.string()),
  period: v.optional(v.string()),
  sourceEngine,
  sourceQuery: v.string(),
  evidenceUrl: v.string(),
  fetchedAt: v.string(),
  runId: v.id("runs"),
  snapshotId: v.id("snapshots"),
  brandId: v.id("brands"),
  hookType: v.optional(hookType),
  funnelStage: v.optional(funnelStage),
  theme: v.optional(v.string()),
  valueProp: v.optional(v.string()),
  cta: v.optional(v.string()),
  audienceHint: v.optional(v.string()),
  confidence: v.optional(confidence),
  tagMode: v.optional(v.union(v.literal("llm"), v.literal("template"))),
  taggedClaimId: v.optional(v.id("claims")),
  seller: v.optional(v.string()),
  image: v.optional(v.string()),
  totalDaysShown: v.optional(v.number()),
};

export const insertClaims = internalMutation({
  args: { claims: v.array(v.object(claimFields)) },
  returns: v.array(v.id("claims")),
  handler: async (ctx, args) => {
    return ids;
  },
});

export const byRun = query({
  args: { runId: v.id("runs") },
  returns: v.array(claimDocValidator),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (run?.ownerId !== ownerId) throw new Error("Run not found");
  },
});

export const byBrands = query({
  args: { brandIds: v.array(v.id("brands")) },
  returns: v.array(claimDocValidator),
  handler: async (ctx, args) => {
    if (args.brandIds.length > MAX_BRANDS_PER_RUN) {
      throw new ConvexError(
        `Too many brands: ${args.brandIds.length}, limit is ${MAX_BRANDS_PER_RUN}`,
      );
    }
    return claims;
  },
});
const MAX_RECENT_PER_BRAND = 300;

export const overviewFeed = query({
  args: {
    brandIds: v.array(v.id("brands")),
    recentPerBrand: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      brandId: v.id("brands"),
      totalCount: v.number(),
      recent: v.array(claimDocValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const out: Array<{
      brandId: import("./_generated/dataModel").Id<"brands">;
      totalCount: number;
      recent: Array<import("./_generated/dataModel").Doc<"claims">>;
    }> = [];
    for (const brandId of args.brandIds) {
      if (brand?.ownerId !== ownerId) continue;
    }
  },
});

export const runSourceCounts = query({
  args: { runIds: v.array(v.id("runs")) },
  returns: v.array(
    v.object({
      runId: v.id("runs"),
      brandId: v.id("brands"),
      sourceEngine,
      count: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.runIds.length > MAX_SOURCE_COUNT_RUNS) {
      throw new ConvexError(
        `Too many runs: ${args.runIds.length}, limit is ${MAX_SOURCE_COUNT_RUNS}`,
      );
    }
    const out: Array<{
      runId: import("./_generated/dataModel").Id<"runs">;
      brandId: import("./_generated/dataModel").Id<"brands">;
      sourceEngine: import("./_generated/dataModel").Doc<"claims">["sourceEngine"];
      count: number;
    }> = [];
    for (const runId of args.runIds) {
      const run = await ctx.db.get(runId);
      if (run?.ownerId !== ownerId) continue;
      for (const row of rows) {
        const byEngine = counts.get(row.brandId) ?? new Map();
        byEngine.set(row.sourceEngine, (byEngine.get(row.sourceEngine) ?? 0) + 1);
      }
    }
  },
});

export const evidenceSummaryByBrands = query({
  args: { brandIds: v.array(v.id("brands")) },
  returns: v.array(
    v.object({
      brandId: v.id("brands"),
      evidenceCount: v.number(),
      engines: v.array(sourceEngine),
    }),
  ),
  handler: async (ctx, args) => {
    const out: Array<{
      brandId: import("./_generated/dataModel").Id<"brands">;
      evidenceCount: number;
      engines: Array<import("./_generated/dataModel").Doc<"claims">["sourceEngine"]>;
    }> = [];
    for (const brandId of args.brandIds) {
      if (brand?.ownerId !== ownerId) continue;
      const engines = new Set<import("./_generated/dataModel").Doc<"claims">["sourceEngine"]>();
    }
  },
});

export const byBrandAndMetric = query({
  args: { brandId: v.id("brands"), metric: v.string() },
  returns: v.array(claimDocValidator),
  handler: async (ctx, args) => {
    if (brand?.ownerId !== ownerId) throw new Error("Brand not found");
  },
});

const LLM_TAG_SOURCE_ENGINE = "llm_tag";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function googleNewsThumbnail(
  rawResponse: unknown,
  evidenceUrl: string,
): { thumbnailUrl: string | null; publisherName: string | null; snippet: string | null } {
  const items = Array.isArray(root?.news_results) ? root.news_results : [];
}

export const feedThumbnails = query({
  args: { claimIds: v.array(v.id("claims")) },
  returns: v.array(
    v.object({
      claimId: v.id("claims"),
      thumbnailUrl: v.union(v.string(), v.null()),
      publisherName: v.union(v.string(), v.null()),
      faviconUrl: v.union(v.string(), v.null()),
      sourceName: v.union(v.string(), v.null()),
      snippet: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const snapshotCache = new Map<
      string,
      import("./_generated/dataModel").Doc<"snapshots"> | null
    >();
    for (const claimId of args.claimIds) {
      const claim = await ctx.db.get(claimId);
      if (claim.sourceEngine !== "google_news" && claim.sourceEngine !== "google") continue;
      const cacheKey = String(claim.snapshotId);
      let snapshot = snapshotCache.get(cacheKey);
      if (snapshot === undefined) {
      }
    }
  },
});
