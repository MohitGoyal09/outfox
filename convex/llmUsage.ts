import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

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

export const usageForThread = query({
  args: { threadKey: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const cap = Math.min(Math.max(Math.floor(args.limit), 0), MAX_THREAD_USAGE);
    if (cap === 0) return [];
    return rows.filter((row) => row.ownerId === ownerId).reverse();
  },
});
