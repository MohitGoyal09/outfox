import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

const snapshotStatus = v.union(
  v.literal("ok"),
  v.literal("failed"),
  v.literal("unavailable"),
);

export const insertSnapshot = internalMutation({
  args: {
    runId: v.id("runs"),
    brandId: v.id("brands"),
    engine: sourceEngine,
    queryParams: v.any(),
    region: v.string(),
    fetchedAt: v.string(),
    status: snapshotStatus,
    claimIds: v.array(v.id("claims")),
    errorMessage: v.optional(v.string()),
    period: v.optional(v.string()),
    rawResponse: v.optional(v.any()),
    rawResponseHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("snapshots", {
      runId: args.runId,
      brandId: args.brandId,
      engine: args.engine,
      queryParams: args.queryParams,
      region: args.region,
      fetchedAt: args.fetchedAt,
      status: args.status,
      claimIds: args.claimIds,
      ...(args.errorMessage !== undefined
        ? { errorMessage: args.errorMessage }
        : {}),
      ...(args.period !== undefined ? { period: args.period } : {}),
      ...(args.rawResponse !== undefined
        ? { rawResponse: args.rawResponse }
        : {}),
      ...(args.rawResponseHash !== undefined
        ? { rawResponseHash: args.rawResponseHash }
        : {}),
    });
  },
});

export const byRun = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("snapshots")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
  },
});

export const latestByEngine = query({
  args: { brandId: v.id("brands"), engine: sourceEngine },
  handler: async (ctx, args) => {
    return snapshots[0] ?? null;
  },
});
