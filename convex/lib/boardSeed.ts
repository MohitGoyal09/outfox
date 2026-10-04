import { offTopicIds, type TopicalityBrand } from "./topicality";

export type SeedClaim = {
  _id: string;
  brandId: string;
  sourceEngine: string;
  text: string;
  evidenceUrl: string;
  metric?: string;
  sourceQuery?: string;
  taggedClaimId?: string;
  hookType?: string;
  value?: string | number;
  image?: string;
};
export type SeedBrand = TopicalityBrand & { _id: string; isOwnBrand?: boolean };
export type SeedFrame = { title: string; x: number; y: number };

export type SeedColumn = "Hooks" | "Offers" | "Creatives" | "To test";
export type PlannedItem = {
  claimId: string;
  brandId: string;
  brand: string;
  hook: string;
  column: SeedColumn;
  text: string;
  x: number;
  y: number;
  label: string;
};
export type SeedPlan = { ok: true; items: PlannedItem[]; notes: string[] } | { ok: false; reason: string };

export const SEED_PER_COLUMN = 3;
export const SEED_Y_INSET = 60;
export const SEED_Y_PITCH = 220;
const PREVIEW_CHARS = 100;
const CREATIVE_FORMATS = ["image", "video"];
const isHttpUrl = (raw: string): boolean => {
  try {
    const u = new URL(raw);
  } catch {
    return false;
  }
};
const visualScore = (c: SeedClaim) =>
  c.sourceEngine === "youtube" || c.sourceEngine === "youtube_video" || c.sourceEngine === "google_ads_transparency_center" ? 1 : 0;

type Cand = { claim: SeedClaim; hook: string };

function rank(cands: Cand[]): Cand[] {
  return [...cands].sort((a, b) => visualScore(b.claim) - visualScore(a.claim) || (a.claim._id < b.claim._id ? -1 : 1));
}

function pick(cands: Cand[], n: number, distinctHooks: boolean, taken: Set<string>): Cand[] {
  const brands = new Set<string>();
  const hooks = new Set<string>();
  return out;
}
