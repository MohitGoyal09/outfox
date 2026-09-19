import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { MAX_BRANDS_PER_RUN } from "./pipeline/plan";
import { assertDemoWriteAllowed } from "./lib/demoGuard";

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
  args: { ...createRunArgs, refreshAuthorized: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    assertDemoWriteAllowed();
  },
});

type TerminalStatus = "complete" | "partial" | "failed";

export const internalCloseRun = internalMutation({
  args: closeRunArgs,
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (run === null) {
      throw new Error(`Run not found: ${args.runId}`);
    }
    await patchRunClosed(ctx, args.runId, args.status, args.errorMessage);
  },
});
const DEFAULT_STALE_RUN_LIMIT = 100;

type CloseStaleRunsArgs = {
  olderThanMs?: number;
  limit?: number;
};

async function closeStaleRunsHandler(
  ctx: MutationCtx,
  args: CloseStaleRunsArgs,
): Promise<{ closed: number }> {
  const olderThanMs = args.olderThanMs ?? DEFAULT_STALE_RUN_MS;
  const limit = Math.max(0, Math.floor(args.limit ?? DEFAULT_STALE_RUN_LIMIT));
  const stale = running
    .filter((run) => run.requestedAt < cutoff)
    .sort((a, b) => (a.requestedAt < b.requestedAt ? -1 : 1))
    .slice(0, limit);
  const minutes = Math.max(1, Math.round(olderThanMs / 60000));
  for (const run of stale) {
    await patchRunClosed(ctx, run._id, "failed", errorMessage);
  }
}

export const closeStaleRunsPublic = mutation({
  args: closeStaleRunsArgs,
  handler: async (ctx, args) => {
    assertDemoWriteAllowed();
    return await closeStaleRunsHandler(ctx, args);
  },
});

export const internalRecordUsage = internalMutation({
  args: {
    runId: v.id("runs"),
    requestCount: v.number(),
    creditCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
  },
});

export const latestForCohort = query({
  args: { cohortKey: v.string() },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("runs")
      .withIndex("by_cohort", (q) => q.eq("cohortKey", args.cohortKey))
      .collect();
    return pickLatestRun(runs);
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
