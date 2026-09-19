import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const terminalStatus = v.union(
  v.literal("complete"),
  v.literal("partial"),
  v.literal("failed"),
);

const queryableStatus = v.union(
  v.literal("running"),
  v.literal("complete"),
  v.literal("partial"),
  v.literal("failed"),
);

const createRunArgs = {
  cohortKey: v.string(),
  brandIds: v.array(v.id("brands")),
  mode: runMode,
};

export const createRun = mutation({
  args: createRunArgs,
  handler: async (ctx, args) => {
    return await ctx.db.insert("runs", {
      cohortKey: args.cohortKey,
      brandIds: args.brandIds,
      mode: args.mode,
      status: "running",
      requestedAt: new Date().toISOString(),
      requestCount: 0,
    });
  },
});

export const internalCreateRun = internalMutation({
  args: createRunArgs,
  handler: async (ctx, args) => {
    return await ctx.db.insert("runs", {
      cohortKey: args.cohortKey,
      brandIds: args.brandIds,
      mode: args.mode,
      status: "running",
      requestedAt: new Date().toISOString(),
      requestCount: 0,
    });
  },
});

export const closeRun = mutation({
  args: closeRunArgs,
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (run === null) {
      throw new Error(`Run not found: ${args.runId}`);
    }
  },
});

export const latestForCohort = query({
  args: { cohortKey: v.string() },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("runs")
      .withIndex("by_cohort", (q) => q.eq("cohortKey", args.cohortKey))
      .collect();
    runs.sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  },
});

export const listByStatus = query({
  args: { status: queryableStatus },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("runs")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});
