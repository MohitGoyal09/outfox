import { action, internalQuery, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { requireUserId } from "./lib/auth";
import type { CreateBrandProfileResult } from "./pipeline/brandProfile";
import { normalizeBrandDomain } from "./lib/brandDomain";

export type CatalogEntry = Doc<"brandCatalog">;

const catalogEntryValidator = v.object({
  _id: v.id("brandCatalog"),
  _creationTime: v.number(),
  name: v.string(),
  domain: v.string(),
  vertical: v.string(),
  aliases: v.array(v.string()),
  adsTransparencyAdvertiserId: v.optional(v.string()),
  description: v.optional(v.string()),
  featured: v.boolean(),
});

const profileStatusValidator = v.union(
  v.literal("pending"),
  v.literal("ready"),
  v.literal("needs_confirmation"),
);

export type CatalogSeedRow = {
  name: string;
  domain: string;
  vertical: string;
  aliases: string[];
  description?: string;
  featured: boolean;
  adsTransparencyAdvertiserId?: string;
};

export type CatalogValidationResult = { valid: boolean; errors: string[] };

export function validateCatalogEntry(entry: CatalogSeedRow): CatalogValidationResult {
  const errors: string[] = [];
  if (typeof entry.name !== "string" || entry.name.trim() === "") {
    errors.push("name is required");
  }
  const domain = typeof entry.domain === "string" ? normalizeBrandDomain(entry.domain) : "";
  if (typeof entry.vertical !== "string" || entry.vertical.trim() === "") {
    errors.push("vertical is required");
  }
  if (typeof entry.featured !== "boolean") {
    errors.push("featured must be a boolean");
  }
  return { valid: errors.length === 0, errors };
}


export const listFeatured = query({
  args: {},
  returns: v.array(catalogEntryValidator),
  handler: async (ctx) => {
    await requireUserId(ctx);
    const rows = await ctx.db.query("brandCatalog").collect();
  },
});

export const search = query({
  args: { query: v.string() },
  returns: v.array(catalogEntryValidator),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
    const rows = await ctx.db.query("brandCatalog").collect();
    return searchCatalogByName(rows, args.query);
  },
});

export const byVertical = query({
  args: { vertical: v.string() },
  returns: v.array(catalogEntryValidator),
  handler: async (ctx, args) => {
    await requireUserId(ctx);
  },
});

export const getEntryInternal = internalQuery({
  args: { catalogId: v.id("brandCatalog") },
  returns: v.union(catalogEntryValidator, v.null()),
  handler: async (ctx, args) => await ctx.db.get(args.catalogId),
});
