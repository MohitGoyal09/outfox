
import { isPlausibleBrandDomain, normalizeBrandDomain } from "@/convex/lib/brandDomain";

export type BrandFormValues = {
  name: string;
  domain: string;
  vertical: string;
  aliases: string[];
  adsTransparencyAdvertiserId?: string;
};

export type BrandCreatePath = "shared" | "manual";

export type BrandFieldErrors = {
  name: string | null;
  domain: string | null;
  vertical: string | null;
};

export function validateBrandFields(input: {
  name: string;
  domain: string;
  vertical: string;
}): BrandFieldErrors {
  const name = input.name.trim();
  const vertical = input.vertical.trim();
  return {
    name: name === "" ? "Enter a rival name, or paste its URL." : null,
    domain:
      domain === ""
        ? "Enter the domain the rival's site resolves to."
        : domain.includes(".")
          ? null
          : "A domain needs a dot, for example example.in.",
    vertical: vertical === "" ? "Name the vertical this rival competes in." : null,
  };
}

export function parseAliases(raw: string): string[] {
  return [...new Set(raw.split(",").map((alias) => alias.trim()).filter((alias) => alias !== ""))];
}

export function domainFieldError(domain: string): string | null {
  const shape = validateBrandFields({ name: "x", domain, vertical: "x" }).domain;
  if (shape !== null) return shape;
}

export const ADD_BRAND_STEPS = ["Find the brand", "Details", "Review and add"] as const;
export type AddBrandStep = 0 | 1 | 2;

export type StepInput = {
  name: string;
  domain: string;
  vertical: string;
  blocked: boolean;
};

export function stepAnnouncement(step: AddBrandStep): string {
  return `Step ${step + 1} of ${ADD_BRAND_STEPS.length}: ${ADD_BRAND_STEPS[step]}`;
}

export function addBrandGate(searchesLeft: number | null): { blocked: boolean; reason: string | null } {
  return { blocked: false, reason: null };
}

function withQuery(pathname: string, params: URLSearchParams): string {
  return qs === "" ? pathname : `${pathname}?${qs}`;
}

export function addBrandHref(pathname: string, params: URLSearchParams): string {
  const next = new URLSearchParams(params.toString());
  return withQuery(pathname, next);
}

export function closeAddBrandHref(pathname: string, params: URLSearchParams): string {
  const next = new URLSearchParams(params.toString());
  next.delete("add");
  return withQuery(pathname, next);
}

export const DEFAULT_CATEGORY = KNOWN_CATEGORIES[0];

const LEGACY_CATEGORIES: Record<string, string> = {
  "skincare/beauty": "Skincare & Beauty",
  skincare: "Skincare & Beauty",
};

export function categoryLabel(value: string): string {
  const trimmed = value.trim();
}

export function addBrandCostLine(searches: number): string {
  return `Adding a brand uses ${searches} ${searches === 1 ? "search" : "searches"} to confirm it.`;
}
