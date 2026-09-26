import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v, type Infer } from "convex/values";
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

export const latestForCohortInternal = internalQuery({
  args: { cohortKey: v.string() },
  returns: v.union(runDocValidator, v.null()),
  handler: async (ctx, args) => {
    const runs = await ctx.db.query("runs").collect();
  },
});

export function creditsSnapshotOf(
  run: Pick<Doc<"runs">, "_id" | "requestedAt" | "searchesLeftAfter">,
): { runId: Id<"runs">; requestedAt: string; searchesLeftAfter: number | null } {
  return {
    runId: run._id,
    requestedAt: run.requestedAt,
    searchesLeftAfter: run.searchesLeftAfter ?? null,
  };
}

type AgentPlan = Infer<typeof agentPlanValidator>;
type StepState = Infer<typeof stepStateValidator>;

type AgentProgressArgs = {
  plan?: AgentPlan;
  currentStep?: string;
  stepStates?: StepState[];
  errorMessage?: string;
};

export function buildAgentProgressPatch(
  args: AgentProgressArgs,
): Partial<{
  plan: AgentPlan;
  currentStep: string;
  stepStates: StepState[];
  errorMessage: string;
}> {
  return {
    ...(args.plan !== undefined ? { plan: args.plan } : {}),
    ...(args.currentStep !== undefined ? { currentStep: args.currentStep } : {}),
    ...(args.stepStates !== undefined ? { stepStates: args.stepStates } : {}),
    ...(args.errorMessage !== undefined
      ? { errorMessage: args.errorMessage }
      : {}),
  };
}

export const savePlanPublic = mutation({
  args: {
    runId: v.id("runs"),
    plan: v.optional(agentPlanValidator),
    currentStep: v.optional(v.string()),
    stepStates: v.optional(v.array(stepStateValidator)),
    errorMessage: v.optional(v.string()),
  },
  returns: v.id("runs"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const run = await ctx.db.get(args.runId);
    await ctx.db.patch(args.runId, buildAgentProgressPatch(args));
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
    await ctx.db.patch(args.runId, buildAgentProgressPatch(args));
  },
});
