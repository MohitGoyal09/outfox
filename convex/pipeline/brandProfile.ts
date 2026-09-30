"use node";

import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { fetchGoogleSearch, resolveAdsTransparencyAdvertiser } from "./fetchEngines";
import { requireUserId } from "../lib/auth";
import { isPlausibleBrandDomain, normalizeBrandDomain } from "../lib/brandDomain";

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
    if (exact.profileStatus !== "ready") {
    }
    return {
      brandId: exact._id,
      status: exact.profileStatus,
      needsConfirmation: exact.profileStatus === "needs_confirmation",
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
  if (profile.status === "ok") {
    return { brandId, status: "ready", needsConfirmation: false };
  }
}
