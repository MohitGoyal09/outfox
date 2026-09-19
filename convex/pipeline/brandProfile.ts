import { action, internalMutation } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

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

export const insertBrandProfileInternal = internalMutation({
  args: {
    name: v.string(),
    domain: v.string(),
    vertical: v.string(),
    aliases: v.array(v.string()),
    profileStatus: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("needs_confirmation"),
    ),
    adsTransparencyAdvertiserId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"brands">> => {
    return await ctx.db.insert("brands", {
      name: args.name,
      domain: args.domain,
      vertical: args.vertical,
      aliases: args.aliases,
      profileStatus: args.profileStatus,
      adsTransparencyAdvertiserId: args.adsTransparencyAdvertiserId,
      createdAt: new Date().toISOString(),
    });
  },
});

export const createBrandProfile = action({
  args: {
    name: v.string(),
    domain: v.string(),
    vertical: v.string(),
    aliases: v.optional(v.array(v.string())),
    adsTransparencyAdvertiserId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CreateBrandProfileResult> => {
    const domain = args.domain.trim();
    const vertical = args.vertical.trim();

    if (name === "" || domain === "" || vertical === "") {
      throw new ConvexError("name, domain, and vertical must be non-empty");
    }
    if (!domain.includes(".")) {
      throw new ConvexError("domain must contain '.' (e.g. example.in)");
    }

    const exact = (await ctx.runQuery(api.brands.getByName, {
      name,
    })) as Doc<"brands"> | null;

    if (exact !== null) {
      if (exact.domain.toLowerCase() !== domain.toLowerCase()) {
        await ctx.runMutation(internal.pipeline.brandProfile.markNeedsConfirmationInternal, {
          brandId: exact._id,
        });
        return {
          brandId: exact._id,
          status: "needs_confirmation",
          needsConfirmation: true,
          candidates: [toCandidate({ ...exact, profileStatus: "needs_confirmation" })],
        };
      }
      return {
        brandId: exact._id,
        status: exact.profileStatus,
        needsConfirmation: exact.profileStatus === "needs_confirmation",
      };
    }
    const lowered = name.toLowerCase();
    const candidates = all
      .filter((brand) => {
        return existing.includes(lowered) || lowered.includes(existing);
      })
      .map(toCandidate);

    if (candidates.length > 0) {
      const brandId = (await ctx.runMutation(
        internal.pipeline.brandProfile.insertBrandProfileInternal,
        {
          name,
          domain,
          vertical,
          aliases,
          profileStatus: "needs_confirmation",
          adsTransparencyAdvertiserId: args.adsTransparencyAdvertiserId,
        },
      )) as Id<"brands">;
    }
    return { brandId, status: "ready", needsConfirmation: false };
  },
});
