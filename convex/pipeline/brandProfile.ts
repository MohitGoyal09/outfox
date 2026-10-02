"use node";

import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { fetchGoogleSearch, resolveAdsTransparencyAdvertiser } from "./fetchEngines";
import { requireUserId } from "../lib/auth";
import { isPlausibleBrandDomain, normalizeBrandDomain, resultsShowDomain } from "../lib/brandDomain";

export type ProfileStatus = Doc<"brands">["profileStatus"];

const profileStatusValidator = v.union(
  v.literal("pending"),
  v.literal("ready"),
  v.literal("needs_confirmation"),
);

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
  created: boolean;
  candidates?: BrandCandidate[];
};

export type RefreshBrandProfileResult = {
  brandId: Id<"brands">;
  lastRefreshedAt: string;
};

export type CreateBrandProfileIO = {
  listOwnerBrands: () => Promise<Doc<"brands">[]>;
  insertBrand: (args: {
    name: string;
    domain: string;
    vertical: string;
    aliases: string[];
    profileStatus: ProfileStatus;
    adsTransparencyAdvertiserId?: string;
  }) => Promise<Id<"brands">>;
  markReady: (brandId: Id<"brands">, lastRefreshedAt: string) => Promise<void>;
};

export type CreateBrandProfileDeps = {
  fetchGoogleSearchFn?: typeof fetchGoogleSearch;
  resolveAdvertiserFn?: typeof resolveAdsTransparencyAdvertiser;
};

async function maybeResolveAdvertiserId(
  brand: { name: string; domain: string },
  suppliedAdvertiserId: string | undefined,
  resolveAdvertiserFn: typeof resolveAdsTransparencyAdvertiser,
): Promise<string | undefined> {
  const supplied = suppliedAdvertiserId?.trim();
  return resolved.status === "resolved" ? resolved.advertiserId : undefined;
}

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

export async function createBrandProfileCore(
  io: CreateBrandProfileIO,
  args: CreateBrandProfileInput,
  deps: CreateBrandProfileDeps = {},
): Promise<CreateBrandProfileResult> {
  const fetchGoogleSearchFn = deps.fetchGoogleSearchFn ?? fetchGoogleSearch;
  const domain = normalizeBrandDomain(args.domain);
  const vertical = args.vertical.trim();

  if (name === "" || args.domain.trim() === "" || vertical === "") {
    throw new ConvexError("name, domain, and vertical must be non-empty");
  }
  if (!isPlausibleBrandDomain(domain)) {
    throw new ConvexError("domain must be a website, e.g. example.in");
  }

  const all = await io.listOwnerBrands();

  if (exact !== null) {
    return {
      brandId: exact._id,
      status: exact.profileStatus,
      needsConfirmation: exact.profileStatus === "needs_confirmation",
      created: false,
    };
  }

  const lowered = name.toLowerCase();

  const adsTransparencyAdvertiserId = await maybeResolveAdvertiserId(
    { name, domain },
    args.adsTransparencyAdvertiserId,
    deps.resolveAdvertiserFn ?? resolveAdsTransparencyAdvertiser,
  );

  if (candidates.length > 0) {
    return {
      brandId,
      status: "needs_confirmation",
      needsConfirmation: true,
      candidates,
      created: true,
    };
  }

  const brandId = await io.insertBrand({
    name,
    domain,
    vertical,
    aliases,
    profileStatus: "pending",
    adsTransparencyAdvertiserId,
  });
  if (profile.status === "ok" && resultsShowDomain(profile.data, domain)) {
  }
  return { brandId, status: "pending", needsConfirmation: false, created: true };
}

export const createBrandProfile = action({
  args: {
    name: v.string(),
    domain: v.string(),
    vertical: v.string(),
    aliases: v.optional(v.array(v.string())),
    adsTransparencyAdvertiserId: v.optional(v.string()),
  },
  returns: v.object({
    brandId: v.id("brands"),
    status: profileStatusValidator,
    needsConfirmation: v.boolean(),
    created: v.boolean(),
    candidates: v.optional(
      v.array(
        v.object({
          _id: v.id("brands"),
          name: v.string(),
          domain: v.string(),
          vertical: v.string(),
          profileStatus: profileStatusValidator,
        }),
      ),
    ),
  }),
  handler: async (ctx, args): Promise<CreateBrandProfileResult> => {
    const ownerId = await requireUserId(ctx);
    const io: CreateBrandProfileIO = {
      listOwnerBrands: async () =>
        (await ctx.runQuery(api.brands.listBrands, {})) as Doc<"brands">[],
      insertBrand: async (insertArgs) =>
        (await ctx.runMutation(internal.pipeline.brandProfileDb.insertBrandProfileInternal, {
          ownerId,
          ...insertArgs,
        })) as Id<"brands">,
      markReady: async (brandId, lastRefreshedAt) => {
        await ctx.runMutation(internal.pipeline.brandProfileDb.markReadyInternal, {
          brandId,
          lastRefreshedAt,
          ownerId,
        });
      },
    };
    return await createBrandProfileCore(io, args);
  },
});
