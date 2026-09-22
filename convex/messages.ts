import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

const MAX_TEXT_LENGTH = 4000;
const MAX_RECENT = 50;

type AppendTurnArgs = {
  ownerId?: Id<"users">;
  threadKey: string;
  role: "user" | "assistant";
  text: string;
  citations: string[];
  runId?: Id<"runs">;
};

export const appendTurn = internalMutation({
  args: appendTurnArgs,
  returns: v.id("messages"),
  handler: appendTurnHandler,
});

export const appendTurnPublic = mutation({
  args: appendTurnArgs,
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (args.runId !== undefined) {
      const run = await ctx.db.get(args.runId);
      if (run?.ownerId !== ownerId) throw new Error("Run not found");
    }
    return await appendTurnHandler(ctx, { ...args, ownerId });
  },
});

export const listRecent = query({
  args: { threadKey: v.string(), limit: v.number() },
  returns: v.array(
    v.object({
      id: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      text: v.string(),
      citations: v.array(v.string()),
      createdAt: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (cap === 0) {
      return [];
    }
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_createdAt", (q) =>
        q.eq("threadKey", args.threadKey),
      )
      .order("desc")
      .take(cap);
    return rows.filter((row) => row.ownerId === ownerId).reverse().map((row) => ({
      id: String(row._id),
      role: row.role,
      text: row.text,
      citations: row.citations,
      createdAt: row.createdAt,
    }));
  },
});

export const clearMyThread = mutation({
  args: { threadKey: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_thread_and_createdAt", (q) =>
        q.eq("threadKey", args.threadKey),
      )
      .collect();
    for (const row of rows) {
      if (row.ownerId !== ownerId) continue;
    }
  },
});
