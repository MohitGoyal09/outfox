import { internalMutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireUserId } from "./lib/auth";
import { MAX_BRANDS_PER_RUN } from "./pipeline/plan";

const sourceEngine = v.union(
  v.literal("google"),
  v.literal("google_ads_transparency_center"),
  v.literal("youtube"),
  v.literal("youtube_video"),
  v.literal("google_trends"),
  v.literal("google_news"),
  v.literal("llm_tag"),
);

const funnelStage = v.union(
  v.literal("unaware"),
  v.literal("problem_aware"),
  v.literal("solution_aware"),
  v.literal("product_aware"),
  v.literal("most_aware"),
  v.literal("not_applicable"),
);

export const byRun = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (run?.ownerId !== ownerId) throw new Error("Run not found");
  },
});

export const byBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    if (brand?.ownerId !== ownerId) throw new Error("Brand not found");
  },
});

export const byBrandAndMetric = query({
  args: { brandId: v.id("brands"), metric: v.string() },
  handler: async (ctx, args) => {
    if (brand?.ownerId !== ownerId) throw new Error("Brand not found");
  },
});
