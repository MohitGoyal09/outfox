import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_TASK_LENGTH = 40;

const costSourceValidator = v.union(
  v.literal("provider"),
  v.literal("estimated"),
  v.literal("unknown"),
);

export type UsageRow = {
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  costSource?: "provider" | "estimated" | "unknown";
  estimatedCostUsd?: number;
};

export function summarizeUsageRows(rows: UsageRow[]): {
  requests: number;
  tokens: number;
  costUsd: number;
  exactCostUsd: number;
  estimatedCostUsd: number;
} {
  let exactCostUsd = 0;
}

export const recordUsage = internalMutation({
  args: {
    runId: v.optional(v.id("runs")),
    threadKey: v.optional(v.string()),
    eventId: v.optional(v.id("agentEvents")),
    alias: aliasValidator,
    provider: v.string(),
    model: v.string(),
    task: v.string(),
    ok: v.boolean(),
    latencyMs: v.number(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    totalTokens: v.optional(v.number()),
    costUsd: v.optional(v.number()),
    costSource: v.optional(costSourceValidator),
    gatewayGenerationId: v.optional(v.string()),
    estimatedCostUsd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.task.length > MAX_TASK_LENGTH) {
      throw new Error(
        `task label too long: ${args.task.length}, limit is ${MAX_TASK_LENGTH}`,
      );
    }
    return await ctx.db.insert("llmUsage", {
      alias: args.alias,
      provider: args.provider,
      model: args.model,
      task: args.task,
      ok: args.ok,
      latencyMs: args.latencyMs,
      createdAt: new Date().toISOString(),
      ...(args.runId !== undefined ? { runId: args.runId } : {}),
      ...(args.threadKey !== undefined ? { threadKey: args.threadKey } : {}),
      ...(args.eventId !== undefined ? { eventId: args.eventId } : {}),
      ...(args.promptTokens !== undefined
        ? { promptTokens: args.promptTokens }
        : {}),
      ...(args.completionTokens !== undefined
        ? { completionTokens: args.completionTokens }
        : {}),
      ...(args.totalTokens !== undefined
        ? { totalTokens: args.totalTokens }
        : {}),
      ...(args.costUsd !== undefined ? { costUsd: args.costUsd } : {}),
      ...(args.costSource !== undefined ? { costSource: args.costSource } : {}),
      ...(args.gatewayGenerationId !== undefined
        ? { gatewayGenerationId: args.gatewayGenerationId }
        : {}),
      ...(args.estimatedCostUsd !== undefined
        ? { estimatedCostUsd: args.estimatedCostUsd }
        : {}),
    });
  },
});

export const usageForRun = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("llmUsage")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
    return summarizeUsageRows(rows);
  },
});
