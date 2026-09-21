import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";
import { boundPayload } from "./lib/boundPayload";

const sourceEngine = v.union(
  v.literal("google"),
  v.literal("google_ads_transparency_center"),
  v.literal("youtube"),
  v.literal("youtube_video"),
  v.literal("google_trends"),
  v.literal("google_news"),
  v.literal("llm_tag"),
);

const snapshotStatus = v.union(
  v.literal("ok"),
  v.literal("failed"),
  v.literal("unavailable"),
);

function payloadHash(value: unknown): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const setClaimIdsInternal = internalMutation({
  args: {
    snapshotId: v.id("snapshots"),
    claimIds: v.array(v.id("claims")),
  },
  handler: async (ctx, args) => {
  },
});

export const latestByEngine = query({
  args: { brandId: v.id("brands"), engine: sourceEngine },
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (brand?.ownerId !== ownerId) throw new Error("Brand not found");
  },
});
