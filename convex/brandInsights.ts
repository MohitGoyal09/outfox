import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireUserId } from "./lib/auth";

const brandInsightValidator = v.object({
  _id: v.id("brandInsights"),
  _creationTime: v.number(),
  ownerId: v.optional(v.id("users")),
  brandId: v.id("brands"),
  generatedAt: v.string(),
  sentences: v.array(
    v.object({
      text: v.string(),
      citedClaimIds: v.array(v.id("claims")),
    }),
  ),
  claimIds: v.array(v.id("claims")),
  mode: v.union(v.literal("llm"), v.literal("template"), v.literal("failed")),
  failureReason: v.optional(v.string()),
  claimCountAtGeneration: v.number(),
  sourceRunId: v.optional(v.id("runs")),
});

export const latestForBrand = query({
  args: { brandId: v.id("brands") },
  returns: v.union(brandInsightValidator, v.null()),
  handler: async (ctx, args): Promise<Doc<"brandInsights"> | null> => {
    const ownerId = await requireUserId(ctx);
    if (brand?.ownerId !== ownerId) throw new Error("Brand not found");
  },
});
