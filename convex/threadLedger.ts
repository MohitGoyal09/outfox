import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

const sourceEngine = v.union(
  v.literal("google"),
  v.literal("google_ads_transparency_center"),
  v.literal("youtube"),
  v.literal("youtube_video"),
  v.literal("google_trends"),
  v.literal("google_news"),
  v.literal("llm_tag"),
);

const ledgerRowValidator = v.object({
  n: v.number(),
  ...refFields,
});

export function assignBatchNumbers(currentMaxN: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => currentMaxN + i + 1);
}

export function evictionCandidates<T extends { id: string; n: number }>(
  rows: T[],
  cap: number,
): string[] {
  if (rows.length <= cap) return [];
  return [...rows]
    .sort((a, b) => a.n - b.n)
    .slice(0, overflow)
    .map((row) => row.id);
}

export const resolveClaimId = query({
  args: { threadKey: v.string(), n: v.number() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (row === null || row.ownerId !== ownerId) return null;
  },
});
