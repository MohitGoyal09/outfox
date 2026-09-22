import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { fetchSerpApiAccount } from "./lib/serpApiAccount";
import { summarizeUsageRows } from "./llmUsage";
import { requireUserId } from "./lib/auth";

export const internalSnapshotRunCredits = internalMutation({
  args: {
    runId: v.id("runs"),
    requestCount: v.number(),
    creditsReported: v.boolean(),
    creditCount: v.optional(v.number()),
    searchesLeftBefore: v.optional(v.number()),
    searchesLeftAfter: v.optional(v.number()),
  },
  returns: v.id("runs"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      requestCount: args.requestCount,
      creditsReported: args.creditsReported,
      ...(args.creditCount !== undefined ? { creditCount: args.creditCount } : {}),
      ...(args.searchesLeftBefore !== undefined
        ? { searchesLeftBefore: args.searchesLeftBefore }
        : {}),
      ...(args.searchesLeftAfter !== undefined
        ? { searchesLeftAfter: args.searchesLeftAfter }
        : {}),
    });
  },
});

export const listReconcilableRows = internalQuery({
  args: { runId: v.optional(v.id("runs")), limit: v.number() },
  returns: v.array(
    v.object({
      rowId: v.id("llmUsage"),
      gatewayGenerationId: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.floor(args.limit));
  },
});

export const costSplitForRun = query({
  args: { runId: v.id("runs") },
  returns: v.object({
    requests: v.number(),
    tokens: v.number(),
    costUsd: v.number(),
    exactCostUsd: v.number(),
    estimatedCostUsd: v.number(),
    reconcilable: v.number(),
  }),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const run = await ctx.db.get(args.runId);
    if (run?.ownerId !== ownerId) throw new Error("Run not found");
    const rows = await ctx.db
      .query("llmUsage")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
    const split = summarizeUsageRows(rows);
  },
});
