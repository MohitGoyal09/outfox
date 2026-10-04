import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";
import { requireUserId } from "./lib/auth";
import { deleteEdgesTouching } from "./lib/canvasEdges";
import { starterFrames } from "../components/drishti/boards/starter-frames";
import { planSeed, type SeedBrand, type SeedClaim } from "./lib/boardSeed";

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

async function insertSeededBoard(ctx: MutationCtx, ownerId: Id<"users">, name: string): Promise<Id<"boards">> {
  const now = new Date().toISOString();
  for (const frame of starterFrames()) {
    await ctx.db.insert("boardFrames", { ownerId, boardId, ...frame, createdAt: now, updatedAt: now });
  }
  return boardId;
}

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

async function saveItem(
  ctx: MutationCtx,
  ownerId: Id<"users">,
  args: {
    boardId: Id<"boards">;
    claimId: Id<"claims">;
    note?: string;
    context?: { question?: string; threadKey?: string; pageLabel?: string };
    x?: number;
    y?: number;
  },
): Promise<Id<"boardItems">> {
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

  return await ctx.db.insert("boardItems", {
    ownerId,
    boardId: args.boardId,
    claimId: args.claimId,
    note: args.note,
    createdAt: new Date().toISOString(),
    ...(args.context !== undefined ? { context: args.context } : {}),
    ...(args.x !== undefined && args.y !== undefined ? { x: args.x, y: args.y } : {}),
  });
}

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
    return await saveItem(ctx, ownerId, args);
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

export const seedBoardFromEvidence = internalMutation({
  args: { ownerId: v.id("users"), boardId: v.id("boards"), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (board?.ownerId !== args.ownerId) throw new ConvexError("Board not found for this owner.");
    const items = await ctx.db.query("boardItems").withIndex("by_board", (q) => q.eq("boardId", args.boardId)).collect();
    const frames = await ctx.db.query("boardFrames").withIndex("by_board", (q) => q.eq("boardId", args.boardId)).collect();

    const brands = await ctx.db.query("brands").withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId)).collect();
    const runs = (await ctx.db.query("runs").withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId)).collect())
      .filter((r) => r.status === "complete" || r.status === "partial")
      .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
    for (const brand of brands) {
      const latest = runs.find((r) => r.brandIds.some((id) => id === brand._id));
      if (latest === undefined) continue;
      const rows = await ctx.db
        .query("claims")
        .withIndex("by_run_and_brand", (q) => q.eq("runId", latest._id).eq("brandId", brand._id))
        .collect();
      for (const c of rows) {
        if (c.ownerId !== args.ownerId) continue;
        claims.push({
          _id: c._id, brandId: c.brandId, sourceEngine: c.sourceEngine, text: c.text, evidenceUrl: c.evidenceUrl,
          metric: c.metric, sourceQuery: c.sourceQuery, taggedClaimId: c.taggedClaimId, hookType: c.hookType,
          value: c.value, image: c.image,
        });
      }
    }

    const plan = planSeed({ frames, brands: seedBrands, claims, existingItemCount: items.length });
    return { dryRun: args.dryRun !== false, notes: plan.notes, items: plan.items };
  },
});
