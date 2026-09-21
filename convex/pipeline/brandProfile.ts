"use node";

import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { fetchGoogleSearch } from "./fetchEngines";
import { requireUserId } from "../lib/auth";

export type ProfileStatus = Doc<"brands">["profileStatus"];

export type CreateBrandProfileInput = {
  name: string;
  domain: string;
  vertical: string;
  aliases?: string[];
  adsTransparencyAdvertiserId?: string;
};

export type BrandCandidate = Pick<
  Doc<"brands">,
  "_id" | "name" | "domain" | "vertical" | "profileStatus"
>;

export type CreateBrandProfileResult = {
  brandId: Id<"brands">;
  status: ProfileStatus;
  needsConfirmation: boolean;
  candidates?: BrandCandidate[];
};

export type RefreshBrandProfileResult = {
  brandId: Id<"brands">;
  lastRefreshedAt: string;
};

export function normalizeBrandName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeBrandDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export function buildCohortKey(brandIds: string[]): string {
  return [...brandIds].sort().join(":");
}

function toCandidate(brand: Doc<"brands">): BrandCandidate {
  return {
    _id: brand._id,
    name: brand.name,
    domain: brand.domain,
    vertical: brand.vertical,
    profileStatus: brand.profileStatus,
  };
}

export const createBrandProfile = action({
  args: {
    name: v.string(),
    domain: v.string(),
    vertical: v.string(),
    aliases: v.optional(v.array(v.string())),
    adsTransparencyAdvertiserId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CreateBrandProfileResult> => {
    const ownerId = await requireUserId(ctx);
    const domain = normalizeBrandDomain(args.domain);
    const vertical = args.vertical.trim();

    if (name === "" || domain === "" || vertical === "") {
      throw new ConvexError("name, domain, and vertical must be non-empty");
    }
    if (!domain.includes(".")) {
      throw new ConvexError("domain must contain '.' (e.g. example.in)");
    }

    const lowered = name.toLowerCase();
    const candidates = all
      .filter((brand) => {
        return existing.includes(lowered) || lowered.includes(existing);
      })
      .map(toCandidate);

    if (candidates.length > 0) {
    }

    const brandId = (await ctx.runMutation(
      internal.pipeline.brandProfileDb.insertBrandProfileInternal,
      {
        ownerId,
        name,
        domain,
        vertical,
        aliases,
        profileStatus: "pending",
        adsTransparencyAdvertiserId: args.adsTransparencyAdvertiserId,
      },
    )) as Id<"brands">;
    const profile = await fetchGoogleSearch({ name }, `brand-profile:${String(brandId)}`);
    if (profile.status === "ok") {
    await ctx.runMutation(internal.pipeline.brandProfileDb.markReadyInternal, {
      brandId,
      lastRefreshedAt,
      ownerId,
      });
      return { brandId, status: "ready", needsConfirmation: false };
    }
  },
});

export const refreshBrandProfile = action({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args): Promise<RefreshBrandProfileResult> => {
    const ownerId = await requireUserId(ctx);
    const brand = (await ctx.runQuery(api.brands.getBrand, {
      brandId: args.brandId,
    })) as Doc<"brands"> | null;
    if (brand === null) {
      throw new ConvexError("brand not found");
    }
    if (profile.status !== "ok") {
      throw new ConvexError(`brand profile refresh failed: ${profile.errorMessage}`);
    }
    return { brandId: args.brandId, lastRefreshedAt };
  },
});
