import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { assertDemoWriteAllowed } from "./lib/demoGuard";

const MAX_TEXT_LENGTH = 4000;
const MAX_RECENT = 50;

type AppendTurnArgs = {
  threadKey: string;
  role: "user" | "assistant";
  text: string;
  citations: string[];
  runId?: Id<"runs">;
};

export const appendTurn = internalMutation({
  args: appendTurnArgs,
  handler: appendTurnHandler,
});

export const appendTurnPublic = mutation({
  args: appendTurnArgs,
  handler: async (ctx, args) => {
    assertDemoWriteAllowed();
    return await appendTurnHandler(ctx, args);
  },
});

export const listRecent = query({
  args: { threadKey: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
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
    return rows.reverse().map((row) => ({
      role: row.role,
      text: row.text,
      citations: row.citations,
      createdAt: row.createdAt,
    }));
  },
});
