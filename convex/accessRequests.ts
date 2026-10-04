import { ConvexError, v } from "convex/values";
import { internalQuery, mutation } from "./_generated/server";
import { parseAccessRequest } from "./lib/accessRequestRules";
const HOUR_MS = 60 * 60 * 1000;

export const listRecent = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
  },
});
