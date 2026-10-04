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
    brands.sort((a, b) => Number(b.isOwnBrand === true) - Number(a.isOwnBrand === true));
    return brands;
  },
});

export const getOwnBrand = query({
  args: {},
  returns: v.union(brandDocValidator, v.null()),
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx);
    const brands = await ctx.db.query("brands").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).collect();
    return brands.find((brand) => brand.isOwnBrand === true) ?? null;
  },
});

export const removeUncheckedBrand = mutation({
  args: { brandId: v.id("brands") },
  returns: v.object({ removed: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (brand === null || brand.ownerId !== ownerId) return { removed: false, reason: "not found" };

    const hasSnapshot = (await ctx.db.query("snapshots").withIndex("by_brand", (q) => q.eq("brandId", args.brandId)).first()) !== null;
    const hasClaim = (await ctx.db.query("claims").withIndex("by_brand", (q) => q.eq("brandId", args.brandId)).first()) !== null;
    const hasInsight =
      (await ctx.db
        .query("brandInsights")
        .withIndex("by_brand_and_generatedAt", (q) => q.eq("brandId", args.brandId))
        .first()) !== null;
  },
});

export const setOwnBrand = mutation({
  args: { brandId: v.id("brands") },
  returns: v.id("brands"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (brand?.ownerId !== ownerId) throw new Error("Brand not found");
    const owned = await ctx.db.query("brands").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).collect();
    for (const other of owned) {
      if (other._id !== args.brandId && other.isOwnBrand === true) {
        await ctx.db.patch(other._id, { isOwnBrand: false });
      }
    }
    return args.brandId;
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
  args: { brandIds: v.array(v.id("brands")), confirm: v.boolean() },
  returns: v.object({
    deleted: v.array(
      v.object({
        brandId: v.id("brands"),
        name: v.string(),
        claims: v.number(),
        snapshots: v.number(),
      }),
    ),
    runs: v.number(),
    briefs: v.number(),
    retained: v.object({
      briefs: v.number(),
      brandInsights: v.number(),
      boardItems: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new ConvexError("deleteBrandInternal requires confirm: true");
    }
    const doomed = new Set(args.brandIds.map(String));
    const doomedClaimIds = new Set<string>();
    const deleted: Array<{
      brandId: import("./_generated/dataModel").Id<"brands">;
      name: string;
      claims: number;
      snapshots: number;
    }> = [];

    let briefs = 0;

    const sharedBriefs = (await ctx.db.query("briefs").collect()).filter((brief) =>
      brief.brandIds.some((id) => doomed.has(String(id))),
    ).length;
    const brandInsights = (await ctx.db.query("brandInsights").collect()).filter(
      (insight) => doomed.has(String(insight.brandId)),
    ).length;

    return { deleted, runs, briefs, retained: { briefs: sharedBriefs, brandInsights, boardItems } };
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

export const setAdvertiserIdInternal = internalMutation({
  args: { brandId: v.id("brands"), advertiserId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const trimmed = args.advertiserId.trim();
    if (brand === null) return false;
    if (brand.adsTransparencyAdvertiserId !== undefined) return false;
    return true;
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

export const similarBrands = query({
  args: { brandId: v.id("brands") },
  returns: v.array(
    v.object({
      _id: v.id("brands"),
      name: v.string(),
      domain: v.string(),
      vertical: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (brand?.ownerId !== ownerId) throw new Error("Brand not found");
    return owned
      .filter((row) => row._id !== brand._id && row.vertical === brand.vertical && row.isOwnBrand !== true)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, SIMILAR_BRANDS_LIMIT)
      .map((row) => ({ _id: row._id, name: row.name, domain: row.domain, vertical: row.vertical }));
  },
});

const MAX_SEARCH_TERM_CHARS = 80;

const MAX_MUST_MENTION_TERMS = 10;
const MAX_MUST_MENTION_CHARS = 60;

export const setBrandMustMentionInternal = internalMutation({
  args: { brandId: v.id("brands"), ownerId: v.id("users"), terms: v.array(v.string()) },
  returns: v.object({ mustMention: v.array(v.string()) }),
  handler: async (ctx, args) => {
    if (brand === null || brand.ownerId !== args.ownerId) throw new ConvexError("brand not found for this owner");
    const terms = args.terms.map((t) => t.trim()).filter((t) => t !== "");
    if (terms.some((t) => t.length > MAX_MUST_MENTION_CHARS)) throw new ConvexError(`a term is over ${MAX_MUST_MENTION_CHARS} characters`);
  },
});
