import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

const profileStatus = v.union(
  v.literal("pending"),
  v.literal("ready"),
  v.literal("needs_confirmation"),
);

const createBrandArgs = {
  name: v.string(),
  domain: v.string(),
  vertical: v.string(),
  aliases: v.array(v.string()),
  adsTransparencyAdvertiserId: v.optional(v.string()),
};

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

export const createBrand = mutation({
  args: createBrandArgs,
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const vertical = args.vertical.trim();
    return await ctx.db.insert("brands", {
      ownerId,
      name,
      domain,
      vertical,
      aliases: args.aliases,
      profileStatus: "pending",
      adsTransparencyAdvertiserId: args.adsTransparencyAdvertiserId,
      createdAt: new Date().toISOString(),
    });
  },
});

export const createBrandInternal = internalMutation({
  args: { ...createBrandArgs, ownerId: v.id("users") },
  handler: async (ctx, args) => {
    const vertical = args.vertical.trim();
    const existing = (await ctx.db.query("brands").withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId)).collect()).find(
      (brand) =>
        brand.name.toLowerCase() === name.toLowerCase() &&
        normalizeDomain(brand.domain) === domain,
    );
    return await ctx.db.insert("brands", {
      ownerId: args.ownerId,
      name,
      domain,
      vertical,
      aliases: args.aliases,
      profileStatus: "pending",
      adsTransparencyAdvertiserId: args.adsTransparencyAdvertiserId,
      createdAt: new Date().toISOString(),
    });
  },
});
