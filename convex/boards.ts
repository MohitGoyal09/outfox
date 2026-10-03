import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";
import { requireUserId } from "./lib/auth";
import { deleteEdgesTouching } from "./lib/canvasEdges";

export const MAX_BOARD_NAME_LENGTH = 120;

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

const confidence = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

const boardItemContextValidator = v.object({
  question: v.optional(v.string()),
  threadKey: v.optional(v.string()),
  pageLabel: v.optional(v.string()),
});

export function claimSummary(claim: Doc<"claims">) {
  return {
    _id: claim._id,
    text: claim.text,
    metric: claim.metric,
    value: claim.value,
    unit: claim.unit,
    period: claim.period,
    sourceEngine: claim.sourceEngine,
    sourceQuery: claim.sourceQuery,
    evidenceUrl: claim.evidenceUrl,
    fetchedAt: claim.fetchedAt,
    brandId: claim.brandId,
    hookType: claim.hookType,
    funnelStage: claim.funnelStage,
    theme: claim.theme,
    valueProp: claim.valueProp,
    cta: claim.cta,
    audienceHint: claim.audienceHint,
    confidence: claim.confidence,
  };
}

async function threadStillExists(
  ctx: QueryCtx,
  ownerId: Id<"users">,
  threadKey: string,
): Promise<boolean> {
  return rows.some((row) => row.ownerId === ownerId);
}

export const listBoards = query({
  args: {},
  returns: v.array(boardDocValidator),
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx);
  },
});

export const renameBoard = mutation({
  args: { boardId: v.id("boards"), name: v.string() },
  returns: v.id("boards"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (board?.ownerId !== ownerId) throw new Error("Board not found");
    if (!name) {
      throw new ConvexError("name is required");
    }
    return args.boardId;
  },
});

export const listItems = query({
  args: { boardId: v.id("boards") },
  returns: v.array(boardItemDocValidator),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (board?.ownerId !== ownerId) throw new Error("Board not found");
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const resolved = [];
    return resolved;
  },
});

export const removeItem = mutation({
  args: { itemId: v.id("boardItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const item = await ctx.db.get(args.itemId);
    await deleteEdgesTouching(ctx, item.boardId, { kind: "item", id: args.itemId });
    return null;
  },
});
