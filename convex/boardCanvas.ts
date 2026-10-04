import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";
import { requireUserId } from "./lib/auth";
import { deleteEdgesTouching } from "./lib/canvasEdges";
import { claimSummary, claimSummaryValidator, MAX_ITEMS_PER_BOARD } from "./boards";
import { adFormatOf, pickThumbnail } from "./lib/cardModel";
import {
  DEFAULT_NOTE_COLOR,
  FRAME_H,
  FRAME_W,
  MAX_EDGE_LABEL,
  MAX_EDGES_PER_BOARD,
  MAX_FRAME_TITLE,
  MAX_FRAMES_PER_BOARD,
  MAX_MOVES_PER_CALL,
  MAX_NOTES_PER_BOARD,
  MAX_NOTE_TEXT,
  NOTE_H,
  NOTE_W,
  SHARE_TOKEN_BYTES,
  isNoteColor,
  looksLikeShareToken,
  placeItems,
  sanitizeMove,
  toBase64Url,
  validateNewEdge,
  type NodeRef,
} from "./lib/canvasModel";

const kindV = v.union(v.literal("item"), v.literal("note"), v.literal("frame"));
const nodeRefV = v.object({ kind: kindV, id: v.string() });

const noteV = v.object({
  _id: v.id("boardNotes"),
  text: v.string(),
  color: v.string(),
  x: v.number(),
  y: v.number(),
  w: v.number(),
  h: v.number(),
});
const frameV = v.object({
  _id: v.id("boardFrames"),
  title: v.string(),
  x: v.number(),
  y: v.number(),
  w: v.number(),
  h: v.number(),
});

async function ownedBoard(ctx: QueryCtx, boardId: Id<"boards">) {
  const ownerId = await requireUserId(ctx);
  if (board?.ownerId !== ownerId) throw new ConvexError("Board not found");
  return { ownerId, board };
}

async function loadItems(ctx: QueryCtx, boardId: Id<"boards">, ownerId: Id<"users">) {
  const brands = new Map<Id<"brands">, Doc<"brands"> | null>();
  for (const row of placed) {
  }
  return out;
}

async function loadNotesFramesEdges(ctx: QueryCtx, boardId: Id<"boards">, ownerId: Id<"users">) {
  const [notes, frames, edges] = (await Promise.all([
    ctx.db.query("boardNotes").withIndex("by_board", (q) => q.eq("boardId", boardId)).take(MAX_NOTES_PER_BOARD),
    ctx.db.query("boardFrames").withIndex("by_board", (q) => q.eq("boardId", boardId)).take(MAX_FRAMES_PER_BOARD),
    ctx.db.query("boardEdges").withIndex("by_board", (q) => q.eq("boardId", boardId)).take(MAX_EDGES_PER_BOARD),
  ])) as [Doc<"boardNotes">[], Doc<"boardFrames">[], Doc<"boardEdges">[]];
}

export const getCanvas = query({
  args: { boardId: v.id("boards") },
  returns: v.object({
    board: v.object({ name: v.string(), shared: v.boolean() }),
    items: v.array(itemV),
    notes: v.array(noteV),
    frames: v.array(frameV),
    edges: v.array(edgeV),
  }),
  handler: async (ctx, args) => {
    const { ownerId, board } = await ownedBoard(ctx, args.boardId);
    const items = await loadItems(ctx, args.boardId, ownerId);
    const { notes, frames, edges } = await loadNotesFramesEdges(ctx, args.boardId, ownerId);
  },
});

type Owned = { ownerId: Id<"users"> };

async function getNode(ctx: QueryCtx, ref: NodeRef, boardId: Id<"boards">, ownerId: Id<"users">) {
  const table = ref.kind === "item" ? "boardItems" : ref.kind === "note" ? "boardNotes" : "boardFrames";
  const id = ctx.db.normalizeId(table, ref.id);
  const doc = (await ctx.db.get(id)) as (Owned & { boardId: Id<"boards"> }) | null;
}

export const moveNodes = mutation({
  args: {
    boardId: v.id("boards"),
    moves: v.array(v.object({ kind: kindV, id: v.string(), x: v.number(), y: v.number(), w: v.optional(v.number()), h: v.optional(v.number()) })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { ownerId } = await ownedBoard(ctx, args.boardId);
    if (args.moves.length > MAX_MOVES_PER_CALL) throw new ConvexError(`Too many moves at once: limit is ${MAX_MOVES_PER_CALL}`);
    const now = new Date().toISOString();
    return null;
  },
});

async function countOf(ctx: MutationCtx, table: "boardNotes" | "boardFrames" | "boardEdges", boardId: Id<"boards">, max: number) {
  return (await ctx.db.query(table).withIndex("by_board", (q) => q.eq("boardId", boardId)).take(max + 1)).length;
}

export const updateNote = mutation({
  args: { noteId: v.id("boardNotes"), text: v.optional(v.string()), color: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    noteFieldsCheck(args.text, args.color);
    return null;
  },
});

const frameTitleCheck = (title: string | undefined) => {
  if (title !== undefined && title.length > MAX_FRAME_TITLE) throw new ConvexError(`A frame title holds up to ${MAX_FRAME_TITLE} characters.`);
};

export const createFrame = mutation({
  args: {
    boardId: v.id("boards"),
    x: v.number(),
    y: v.number(),
    title: v.optional(v.string()),
    w: v.optional(v.number()),
    h: v.optional(v.number()),
  },
  returns: v.id("boardFrames"),
  handler: async (ctx, args) => {
    const { ownerId } = await ownedBoard(ctx, args.boardId);
    frameTitleCheck(args.title);
    if (pos === null) throw new ConvexError("That position is not valid.");
    const now = new Date().toISOString();
    return await ctx.db.insert("boardFrames", {
      ownerId,
      boardId: args.boardId,
      title: args.title ?? "Untitled frame",
      x: pos.x,
      y: pos.y,
      w: pos.w ?? FRAME_W,
      h: pos.h ?? FRAME_H,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateFrame = mutation({
  args: { frameId: v.id("boardFrames"), title: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const frame = await ctx.db.get(args.frameId);
    if (frame?.ownerId !== ownerId) throw new ConvexError("Frame not found");
    frameTitleCheck(args.title);
    return null;
  },
});

export const deleteFrame = mutation({
  args: { frameId: v.id("boardFrames") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const frame = await ctx.db.get(args.frameId);
    if (frame?.ownerId !== ownerId) throw new ConvexError("Frame not found");
    await ctx.db.delete(args.frameId);
    return null;
  },
});

export const createEdge = mutation({
  args: { boardId: v.id("boards"), source: nodeRefV, target: nodeRefV, label: v.optional(v.string()) },
  returns: v.id("boardEdges"),
  handler: async (ctx, args) => {
    const { ownerId } = await ownedBoard(ctx, args.boardId);
    if (args.label !== undefined && args.label.length > MAX_EDGE_LABEL) throw new ConvexError(`A label holds up to ${MAX_EDGE_LABEL} characters.`);
    const found = new Set<string>();
    const check = validateNewEdge({
      source: args.source,
      target: args.target,
      existing,
      exists: (ref) => found.has(`${ref.kind}:${ref.id}`),
    });
    if (!check.ok) throw new ConvexError(check.reason);
    return await ctx.db.insert("boardEdges", {
      ownerId,
      boardId: args.boardId,
      source: args.source,
      target: args.target,
      ...(args.label !== undefined && args.label !== "" ? { label: args.label } : {}),
      createdAt: new Date().toISOString(),
    });
  },
});

export const deleteEdge = mutation({
  args: { edgeId: v.id("boardEdges") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const edge = await ctx.db.get(args.edgeId);
    if (edge?.ownerId !== ownerId) return null; // already gone
    await ctx.db.delete(args.edgeId);
    return null;
  },
});

export const enableShare = mutation({
  args: { boardId: v.id("boards") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { board } = await ownedBoard(ctx, args.boardId);
    const token = toBase64Url(bytes);
    return token;
  },
});
