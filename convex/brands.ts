import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v, ConvexError } from "convex/values";
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

const SIMILAR_BRANDS_LIMIT = 8;

const enrichmentStatus = v.union(v.literal("hydrating"), v.literal("ready"));

const brandDocValidator = v.object({
  _id: v.id("brands"),
  _creationTime: v.number(),
  ownerId: v.optional(v.id("users")),
  name: v.string(),
  domain: v.string(),
  vertical: v.string(),
  aliases: v.array(v.string()),
  profileStatus,
  adsTransparencyAdvertiserId: v.optional(v.string()),
  createdAt: v.string(),
  lastRefreshedAt: v.optional(v.string()),
  enrichmentStatus: v.optional(enrichmentStatus),
});

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

export const listBrands = query({
  args: {},
  returns: v.array(brandDocValidator),
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx);
    const brands = await ctx.db.query("brands").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).collect();
    brands.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return brands;
  },
});

export const createBrand = mutation({
  args: createBrandArgs,
  returns: v.id("brands"),
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

export const deleteBrandInternal = internalMutation({
  args: { name: v.string(), confirm: v.boolean() },
  returns: v.object({
    deleted: v.boolean(),
    brandId: v.optional(v.string()),
    claims: v.number(),
    snapshots: v.number(),
    runs: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new ConvexError("deleteBrandInternal requires confirm: true");
    }
    if (brand === undefined) {
      return { deleted: false, claims: 0, snapshots: 0, runs: 0 };
    }
    for (const claim of await ctx.db
      .query("claims")
      .withIndex("by_brand", (q) => q.eq("brandId", brand._id))
      .collect()) {
    }

    let snapshots = 0;
    for (const run of await ctx.db.query("runs").collect()) {
      if (run.brandIds.length !== 1 || run.brandIds[0] !== brand._id) continue;
      await ctx.db.delete(run._id);
    }

    await ctx.db.delete(brand._id);
    return { deleted: true, brandId: String(brand._id), claims, snapshots, runs };
  },
});

export const setBrandDomainInternal = internalMutation({
  args: { brandId: v.id("brands"), domain: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const trimmed = args.domain.trim();
    if (trimmed === "") return null;
    await ctx.db.patch(args.brandId, { domain: trimmed });
    return null;
  },
});

export const updateBrandStatusInternal = internalMutation({
  args: {
    brandId: v.id("brands"),
    profileStatus,
    lastRefreshedAt: v.optional(v.string()),
    ownerId: v.id("users"),
  },
  returns: v.id("brands"),
  handler: async (ctx, args) => {
    const patch: {
      profileStatus: "pending" | "ready" | "needs_confirmation";
      lastRefreshedAt?: string;
    } = { profileStatus: args.profileStatus };
    return args.brandId;
  },
});
