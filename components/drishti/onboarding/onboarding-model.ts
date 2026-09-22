
import type { Doc } from "@/convex/_generated/dataModel";
import { MAX_RIVALS_PER_COHORT } from "@/components/drishti/cohorts/cohorts-model";

export type CatalogEntry = Doc<"brandCatalog">;
export type BrandDoc = Doc<"brands">;

function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export type CatalogGroup = { vertical: string; entries: CatalogEntry[] };

export type HydrationStatus = "hydrating" | "ready";

export function hydrationStatusFor(brand: BrandDoc | undefined): HydrationStatus | undefined {
  if (brand === undefined) return undefined;
}
