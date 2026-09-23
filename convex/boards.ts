import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";
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

const funnelStage = v.union(
  v.literal("unaware"),
  v.literal("problem_aware"),
  v.literal("solution_aware"),
  v.literal("product_aware"),
  v.literal("most_aware"),
  v.literal("not_applicable"),
);

const confidence = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

const claimSummaryValidator = v.object({
  _id: v.id("claims"),
  text: v.string(),
  metric: v.optional(v.string()),
  value: v.optional(v.union(v.string(), v.number())),
  unit: v.optional(v.string()),
  period: v.optional(v.string()),
  sourceEngine,
  sourceQuery: v.string(),
  evidenceUrl: v.string(),
  fetchedAt: v.string(),
  brandId: v.id("brands"),
  hookType: v.optional(hookType),
  funnelStage: v.optional(funnelStage),
  theme: v.optional(v.string()),
  valueProp: v.optional(v.string()),
  cta: v.optional(v.string()),
  audienceHint: v.optional(v.string()),
  confidence: v.optional(confidence),
});

const boardItemContextValidator = v.object({
  question: v.optional(v.string()),
  threadKey: v.optional(v.string()),
  pageLabel: v.optional(v.string()),
});

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

export const createBoard = mutation({
  args: { name: v.string() },
  returns: v.id("boards"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (!name) {
      throw new ConvexError("name is required");
    }
    const existingCount = (
      await ctx.db.query("boards").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).collect()
    ).length;
    if (existingCount >= MAX_BOARDS_PER_OWNER) {
      throw new ConvexError(`Too many boards: limit is ${MAX_BOARDS_PER_OWNER}`);
    }
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

export const deleteBoard = mutation({
  args: { boardId: v.id("boards") },
  returns: v.object({ deleted: v.boolean(), itemsDeleted: v.number() }),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (board?.ownerId !== ownerId) {
      return { deleted: false, itemsDeleted: 0 };
    }
    const items = await ctx.db
      .query("boardItems")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    await ctx.db.delete(args.boardId);
    return { deleted: true, itemsDeleted: items.length };
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
    for (const item of items) {
      resolved.push({
        _id: item._id,
        _creationTime: item._creationTime,
        boardId: item.boardId,
        claimId: item.claimId,
        note: item.note,
        createdAt: item.createdAt,
        context: item.context,
        threadExists: threadKey !== undefined ? await threadStillExists(ctx, ownerId, threadKey) : false,
        claim:
          claim !== null && claim.ownerId === ownerId
            ? {
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
              }
            : null,
      });
    }
    return resolved;
  },
});

export const addItem = mutation({
  args: {
    boardId: v.id("boards"),
    claimId: v.id("claims"),
    note: v.optional(v.string()),
    context: v.optional(boardItemContextValidator),
  },
  returns: v.id("boardItems"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (board?.ownerId !== ownerId) throw new Error("Board not found");
    const claim = await ctx.db.get(args.claimId);

    const existing = await ctx.db
      .query("boardItems")
      .withIndex("by_board_and_claim", (q) => q.eq("boardId", args.boardId).eq("claimId", args.claimId))
      .unique();
    if (existing !== null) return existing._id;

    const count = (
      await ctx.db.query("boardItems").withIndex("by_board", (q) => q.eq("boardId", args.boardId)).collect()
    ).length;
    if (count >= MAX_ITEMS_PER_BOARD) {
      throw new ConvexError(`Too many items on this board: limit is ${MAX_ITEMS_PER_BOARD}`);
    }
  },
});

export const removeItem = mutation({
  args: { itemId: v.id("boardItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const item = await ctx.db.get(args.itemId);
    return null;
  },
});
