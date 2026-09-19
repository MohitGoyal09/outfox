import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_TASK_LENGTH = 40;

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
    estimatedCostUsd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.task.length > MAX_TASK_LENGTH) {
      throw new Error(
        `task label too long: ${args.task.length}, limit is ${MAX_TASK_LENGTH}`,
      );
    }
  },
});
