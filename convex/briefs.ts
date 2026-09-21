import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

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
    const run = await ctx.db.get(args.runId);
  },
});
