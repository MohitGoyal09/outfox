import { ABSENT, type FunnelStage, type HookType, type Tone } from "@/components/drishti";
import type {
  CostProvenance,
  EngineCellStatus,
  EngineStatus,
  RunStatus,
} from "./types";


export const FETCH_ENGINES = [
  "google",
  "google_ads_transparency_center",
  "youtube",
  "youtube_video",
  "google_trends",
] as const;

export type FetchEngine = (typeof FETCH_ENGINES)[number];

const ENGINE_LABEL: Record<string, string> = {
  google: "Google Search",
  google_ads_transparency_center: "Ads Transparency",
  youtube: "YouTube Search",
  youtube_video: "YouTube Video",
  google_trends: "Google Trends",
  llm_tag: "Content tag",
};

export const ENGINE_STATUS_WORD: Record<EngineCellStatus, string> = {
  ok: "returned",
  failed: "failed",
  unavailable: "unavailable",
  missing: "not recorded",
};


export const HOOK_WORD: Record<HookType, string> = {
  discount_offer: "promotional",
  social_proof: "social proof",
  founder_story: "founder story",
  problem_solution: "problem–solution",
  product_feature: "product feature",
  urgency_scarcity: "urgency",
  education_explainer: "explainer",
  visual_cold_open: "visual cold open",
  not_applicable: "untagged",
};

export const FUNNEL_WORD: Record<FunnelStage, string> = {
  unaware: "unaware",
  problem_aware: "problem aware",
  solution_aware: "solution aware",
  product_aware: "product aware",
  most_aware: "most aware",
  not_applicable: "untagged",
};


export const RUN_STATUS_TONE: Record<RunStatus, Tone> = {
  running: "neutral",
  complete: "ok",
  partial: "warn",
  failed: "danger",
};

export const SNAPSHOT_STATUS_TONE: Record<EngineStatus, Tone> = {
  ok: "ok",
  failed: "danger",
  unavailable: "weak",
};

const ENGINE_CELL_TONE: Record<EngineCellStatus, Tone> = {
  ok: "ok",
  failed: "danger",
  unavailable: "weak",
  missing: "neutral",
};

export function engineCellTone(status: EngineCellStatus): Tone {
  return ENGINE_CELL_TONE[status];
}


export function costProvenance(
  exact: number | null | undefined,
  estimated: number | null | undefined,
): CostProvenance {
  if (hasExact && hasEstimated) return "mixed";
  if (hasExact) return "exact";
  return "unknown";
}

export const COST_PROVENANCE_LABEL: Record<CostProvenance, string> = {
  exact: "exact",
  estimated: "est.",
  mixed: "exact + est.",
  unknown: ABSENT,
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function parseInstant(value: string | null | undefined): Date | null {
  const date = new Date(value);
}

export function formatRunDate(value: string | null | undefined): string {
  const date = parseInstant(value);
}

export function formatRunDayMonth(value: string | null | undefined): string {
  const date = parseInstant(value);
  return date === null ? ABSENT : DAY_MONTH_FORMAT.format(date);
}

export function formatUsd(value: number | null | undefined): string {
  const fixed = value.toFixed(3);
  return `$${fixed.endsWith("0") ? value.toFixed(2) : fixed}`;
}

export const READOUT_SEPARATOR = "·";
