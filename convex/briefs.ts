import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const insertBrief = internalMutation({
  args: {
    runId: v.id("runs"),
    cohortKey: v.string(),
    brandIds: v.array(v.id("brands")),
    generatedAt: v.string(),
    briefText: v.string(),
    claimIds: v.array(v.id("claims")),
    mode: v.union(v.literal("llm"), v.literal("template")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("briefs", {
      runId: args.runId,
      cohortKey: args.cohortKey,
      brandIds: args.brandIds,
      generatedAt: args.generatedAt,
      briefText: args.briefText,
      claimIds: args.claimIds,
      mode: args.mode,
    });
  },
});
