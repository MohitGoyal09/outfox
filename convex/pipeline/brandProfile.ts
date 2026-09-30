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
