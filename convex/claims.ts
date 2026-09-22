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

const claimDocValidator = v.object({
  _id: v.id("claims"),
  _creationTime: v.number(),
  ownerId: v.optional(v.id("users")),
  ...claimFields,
  audienceHint: v.optional(v.string()),
});

export const insertClaims = internalMutation({
  args: { claims: v.array(v.object(claimFields)) },
  returns: v.array(v.id("claims")),
  handler: async (ctx, args) => {
    return ids;
  },
});

export const byRun = query({
  args: { runId: v.id("runs") },
  returns: v.array(claimDocValidator),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (run?.ownerId !== ownerId) throw new Error("Run not found");
  },
});

export const byBrands = query({
  args: { brandIds: v.array(v.id("brands")) },
  returns: v.array(claimDocValidator),
  handler: async (ctx, args) => {
    if (args.brandIds.length > MAX_BRANDS_PER_RUN) {
      throw new ConvexError(
        `Too many brands: ${args.brandIds.length}, limit is ${MAX_BRANDS_PER_RUN}`,
      );
    }
    return claims;
  },
});

export const byBrandAndMetric = query({
  args: { brandId: v.id("brands"), metric: v.string() },
  returns: v.array(claimDocValidator),
  handler: async (ctx, args) => {
    if (brand?.ownerId !== ownerId) throw new Error("Brand not found");
  },
});
