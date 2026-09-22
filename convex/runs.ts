import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { MAX_BRANDS_PER_RUN } from "./pipeline/plan";
import { requireUserId } from "./lib/auth";

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

export const internalCreateRun = internalMutation({
  args: { ...createRunArgs, ownerId: v.optional(v.id("users")) },
  returns: v.id("runs"),
  handler: async (ctx, args) => {
    const brands = await Promise.all(args.brandIds.map((id) => ctx.db.get(id)));
    const ownerId = args.ownerId ?? brands[0]?.ownerId;
    if (ownerId === undefined || brands.some((brand) => brand?.ownerId !== ownerId)) throw new Error("Brand not found");
    return await ctx.db.insert("runs", {
      ownerId,
      cohortKey: args.cohortKey,
      brandIds: args.brandIds,
      mode: args.mode,
      status: "running",
      requestedAt: new Date().toISOString(),
      requestCount: 0,
    });
  },
});

type TerminalStatus = "complete" | "partial" | "failed";

export const closeRun = mutation({
  args: closeRunArgs,
  returns: v.id("runs"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const run = await ctx.db.get(args.runId);
    await patchRunClosed(ctx, args.runId, args.status, args.errorMessage);
  },
});

export const internalCloseRun = internalMutation({
  args: closeRunArgs,
  returns: v.id("runs"),
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

export const closeStaleRunsPublic = mutation({
  args: closeStaleRunsArgs,
  returns: v.object({ closed: v.number() }),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
  },
});

export const internalRecordLlmTotals = internalMutation({
  args: {
    runId: v.id("runs"),
    llmRequestCount: v.number(),
    llmTokenCount: v.number(),
    llmCostUsd: v.number(),
  },
  returns: v.id("runs"),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (run === null) {
      throw new Error(`Run not found: ${args.runId}`);
    }
    await ctx.db.patch(args.runId, {
      llmRequestCount: args.llmRequestCount,
      llmTokenCount: args.llmTokenCount,
      llmCostUsd: args.llmCostUsd,
    });
  },
});

export const latestForCohort = query({
  args: { cohortKey: v.string() },
  returns: v.union(runDocValidator, v.null()),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const runs = await ctx.db
      .query("runs")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();
  },
});

export const internalSaveAgentProgress = internalMutation({
  args: {
    runId: v.id("runs"),
    plan: v.optional(agentPlanValidator),
    currentStep: v.optional(v.string()),
    stepStates: v.optional(v.array(stepStateValidator)),
    errorMessage: v.optional(v.string()),
  },
  returns: v.id("runs"),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (run === null) {
      throw new Error(`Run not found: ${args.runId}`);
    }
    await ctx.db.patch(args.runId, {
      ...(args.plan !== undefined ? { plan: args.plan } : {}),
      ...(args.currentStep !== undefined ? { currentStep: args.currentStep } : {}),
      ...(args.stepStates !== undefined ? { stepStates: args.stepStates } : {}),
      ...(args.errorMessage !== undefined
        ? { errorMessage: args.errorMessage }
        : {}),
    });
  },
});
