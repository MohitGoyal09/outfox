import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

const funnelStage = v.union(
  v.literal("unaware"),
  v.literal("problem_aware"),
  v.literal("solution_aware"),
  v.literal("product_aware"),
  v.literal("most_aware"),
  v.literal("not_applicable"),
);

export const byRunAndBrand = query({
  args: { runId: v.id("runs"), brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("claims")
      .withIndex("by_run_and_brand", (q) =>
        q.eq("runId", args.runId).eq("brandId", args.brandId),
      )
      .collect();
  },
});
