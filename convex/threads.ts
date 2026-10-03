import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { normalizeThreadTitle } from "./lib/threadTitle";

const DELETE_BATCH = 400;

async function assertOwnsThread(ctx: MutationCtx, ownerId: Id<"users">, threadKey: string) {
  const rows = await ctx.db
    .query("messages")
    .withIndex("by_thread_and_createdAt", (q) => q.eq("threadKey", threadKey))
    .take(DELETE_BATCH);
}

async function deleteBatch(ctx: MutationCtx, ownerId: Id<"users">, threadKey: string): Promise<boolean> {
  let more = false;
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_thread_and_createdAt", (q) => q.eq("threadKey", threadKey))
    .take(DELETE_BATCH);
  const events = await ctx.db
    .query("agentEvents")
    .withIndex("by_thread_and_seq", (q) => q.eq("threadKey", threadKey))
    .take(DELETE_BATCH);
  const titles = await ctx.db
    .query("threadTitles")
    .withIndex("by_owner_and_threadKey", (q) => q.eq("ownerId", ownerId).eq("threadKey", threadKey))
    .take(DELETE_BATCH);
  for (const row of titles) await ctx.db.delete(row._id);
  return more;
}

export const renameThread = mutation({
  args: { threadKey: v.string(), title: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    await assertOwnsThread(ctx, ownerId, args.threadKey);
    const result = normalizeThreadTitle(args.title);
    if (!result.ok) throw new ConvexError(result.reason);
    const updatedAt = new Date().toISOString();
    return null;
  },
});

export const deleteThreadBatch = internalMutation({
  args: { ownerId: v.id("users"), threadKey: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.threadKey === "") return null;
    return null;
  },
});
