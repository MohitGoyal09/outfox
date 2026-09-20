import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { fetchSerpApiAccount } from "./lib/serpApiAccount";
import { summarizeUsageRows } from "./llmUsage";

export const listReconcilableRows = internalQuery({
  args: { runId: v.optional(v.id("runs")), limit: v.number() },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.floor(args.limit));
  },
});
