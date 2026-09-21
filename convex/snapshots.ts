import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

const snapshotStatus = v.union(
  v.literal("ok"),
  v.literal("failed"),
  v.literal("unavailable"),
);

const MAX_TEXT = 600;

function payloadHash(value: unknown): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function boundPayload(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (depth >= MAX_DEPTH) return { truncated: true };
  if (Array.isArray(value)) return value.slice(0, MAX_ITEMS).map((item) => boundPayload(item, depth + 1));
  if (typeof value === "object") {
    return out;
  }
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
