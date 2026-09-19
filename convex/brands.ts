import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

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

export const listBrands = query({
  args: {},
  handler: async (ctx) => {
    brands.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return brands;
  },
});

export const getBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.brandId);
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brands")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
  },
});

export const updateBrandStatus = mutation({
  args: {
    brandId: v.id("brands"),
    profileStatus,
    lastRefreshedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: {
      profileStatus: "pending" | "ready" | "needs_confirmation";
      lastRefreshedAt?: string;
    } = { profileStatus: args.profileStatus };
    return args.brandId;
  },
});

export const createBrandInternal = internalMutation({
  args: createBrandArgs,
  handler: async (ctx, args) => {
    return await ctx.db.insert("brands", {
      name: args.name,
      domain: args.domain,
      vertical: args.vertical,
      aliases: args.aliases,
      profileStatus: "pending",
      adsTransparencyAdvertiserId: args.adsTransparencyAdvertiserId,
      createdAt: new Date().toISOString(),
    });
  },
});
