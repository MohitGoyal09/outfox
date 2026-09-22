import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";
import { boundPayload } from "./lib/boundPayload";

const sourceEngine = v.union(
  v.literal("google"),
  v.literal("google_ads_transparency_center"),
  v.literal("youtube"),
  v.literal("youtube_video"),
  v.literal("google_trends"),
  v.literal("google_news"),
  v.literal("llm_tag"),
);

const snapshotStatus = v.union(
  v.literal("ok"),
  v.literal("failed"),
  v.literal("unavailable"),
);

const snapshotDocValidator = v.object({
  _id: v.id("snapshots"),
  _creationTime: v.number(),
  ownerId: v.optional(v.id("users")),
  runId: v.id("runs"),
  brandId: v.id("brands"),
  engine: sourceEngine,
  queryParams: v.any(),
  region: v.string(),
  fetchedAt: v.string(),
  period: v.optional(v.string()),
  rawResponse: v.optional(v.any()),
  rawResponseHash: v.optional(v.string()),
  claimIds: v.array(v.id("claims")),
  status: snapshotStatus,
  errorMessage: v.optional(v.string()),
});

function payloadHash(value: unknown): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const byRun = query({
  args: { runId: v.id("runs") },
  returns: v.array(snapshotDocValidator),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const run = await ctx.db.get(args.runId);
    if (run?.ownerId !== ownerId) throw new Error("Run not found");
    return await ctx.db
      .query("snapshots")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
  },
});

export const byIds = query({
  args: { snapshotIds: v.array(v.id("snapshots")) },
  returns: v.array(snapshotDocValidator),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const snapshots = [];
    return snapshots;
  },
});

export const latestByEngineAndRegion = query({
  args: { brandId: v.id("brands"), engine: sourceEngine, region: v.string() },
  returns: v.union(snapshotDocValidator, v.null()),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (brand?.ownerId !== ownerId) throw new Error("Brand not found");
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_brand_engine_and_region", (q) =>
        q.eq("brandId", args.brandId).eq("engine", args.engine).eq("region", args.region),
      )
      .collect();
  },
});
