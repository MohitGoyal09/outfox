import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

const MAX_TASK_LENGTH = 40;

const costSourceValidator = v.union(
  v.literal("provider"),
  v.literal("estimated"),
  v.literal("unknown"),
);

const llmUsageRowValidator = v.object({
  _id: v.id("llmUsage"),
  _creationTime: v.number(),
  ownerId: v.optional(v.id("users")),
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
  costBasis: v.optional(
    v.union(v.literal("upstream_inference"), v.literal("total")),
  ),
  estimatedCostUsd: v.optional(v.number()),
  createdAt: v.string(),
});

const usageSummaryValidator = v.object({
  requests: v.number(),
  tokens: v.number(),
  costUsd: v.number(),
  exactCostUsd: v.number(),
  estimatedCostUsd: v.number(),
});

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
    ownerId: v.optional(v.id("users")),
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
  returns: v.id("llmUsage"),
  handler: async (ctx, args) => {
    if (args.task.length > MAX_TASK_LENGTH) {
      throw new Error(
        `task label too long: ${args.task.length}, limit is ${MAX_TASK_LENGTH}`,
      );
    }
    const ownerId = args.runId !== undefined ? (await ctx.db.get(args.runId))?.ownerId : args.ownerId;
    if (args.runId !== undefined && ownerId === undefined) throw new Error("Run not found");
  },
});

export const usageForThread = query({
  args: { threadKey: v.string(), limit: v.number() },
  returns: v.array(llmUsageRowValidator),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const cap = Math.min(Math.max(Math.floor(args.limit), 0), MAX_THREAD_USAGE);
    if (cap === 0) return [];
    return rows.filter((row) => row.ownerId === ownerId).reverse();
  },
});
