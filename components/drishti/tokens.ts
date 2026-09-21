
export type Tone = "ok" | "warn" | "weak" | "danger" | "neutral";

export const TONES: readonly Tone[] = [
  "ok",
  "warn",
  "weak",
  "danger",
  "neutral",
];

export const TONE_COLOR: Record<Tone, string> = {
  ok: "var(--ok, #4ade80)",
  warn: "var(--warn, #fbbf24)",
  weak: "var(--weak, #fb923c)",
  danger: "var(--danger, #f87171)",
  neutral: "var(--text-tertiary, #64646f)",
};


export const HOOK_TYPES = [
  "discount_offer",
  "social_proof",
  "founder_story",
  "problem_solution",
  "product_feature",
  "urgency_scarcity",
  "education_explainer",
  "visual_cold_open",
  "not_applicable",
] as const;

export type HookType = (typeof HOOK_TYPES)[number];

export const HOOK_COLOR: Record<HookType, string> = {
  discount_offer: "var(--hook-discount-offer, #f2a63b)",
  social_proof: "var(--hook-social-proof, #34d399)",
  founder_story: "var(--hook-founder-story, #a78bfa)",
  problem_solution: "var(--hook-problem-solution, #38bdf8)",
  product_feature: "var(--hook-product-feature, #2dd4bf)",
  urgency_scarcity: "var(--hook-urgency-scarcity, #fb7185)",
  education_explainer: "var(--hook-education-explainer, #60a5fa)",
  visual_cold_open: "var(--hook-visual-cold-open, #f472b6)",
  not_applicable: "var(--hook-not-applicable, #6b7280)",
};


export const FUNNEL_STAGES = [
  "unaware",
  "problem_aware",
  "solution_aware",
  "product_aware",
  "most_aware",
  "not_applicable",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const FUNNEL_COLOR: Record<FunnelStage, string> = {
  unaware: "var(--funnel-unaware, #3b6b8f)",
  problem_aware: "var(--funnel-problem-aware, #4a90b8)",
  solution_aware: "var(--funnel-solution-aware, #5cb3d9)",
  product_aware: "var(--funnel-product-aware, #7dd3fc)",
  most_aware: "var(--funnel-most-aware, #a5e4ff)",
  not_applicable: "var(--funnel-not-applicable, #4b5563)",
};

export const FUNNEL_STAGE_INDEX: Record<FunnelStage, number> = {
  unaware: 0,
  problem_aware: 1,
  solution_aware: 2,
  product_aware: 3,
  most_aware: 4,
  not_applicable: 5,
};

export type ScaleKind = "hook" | "funnel";

export function isHookType(value: string): value is HookType {
  return Object.prototype.hasOwnProperty.call(HOOK_COLOR, value);
}

export function isFunnelStage(value: string): value is FunnelStage {
  return Object.prototype.hasOwnProperty.call(FUNNEL_COLOR, value);
}

export function hookDotColor(value: string): string {
  return isHookType(value) ? HOOK_COLOR[value] : TONE_COLOR.neutral;
}

export function funnelDotColor(value: string): string {
  return isFunnelStage(value) ? FUNNEL_COLOR[value] : TONE_COLOR.neutral;
}

export function resolveDotColor(input: {
  tone?: Tone;
  value?: string;
  scale?: ScaleKind;
}): string {
  if (input.tone) return TONE_COLOR[input.tone];
  const value = input.value;
  if (value) {
    if (input.scale === "hook") return hookDotColor(value);
    if (input.scale === "funnel") return funnelDotColor(value);
    if (isHookType(value)) return hookDotColor(value);
    if (isFunnelStage(value)) return funnelDotColor(value);
  }
  return TONE_COLOR.neutral;
}


export type CostSource = "provider" | "estimated" | "unknown";
export type ClassifierSource = "typesafe" | "fallback";

export function costSourceTone(source: CostSource | string): Tone {
  if (source === "provider") return "ok";
  if (source === "estimated") return "warn";
  return "neutral";
}

export function classifierTone(source: ClassifierSource | string): Tone {
  return source === "fallback" ? "warn" : "neutral";
}


export type StepStatus =
  | "pending"
  | "running"
  | "complete"
  | "failed"
  | "skipped";

export const STEP_STATUS_TONE: Record<StepStatus, Tone> = {
  pending: "neutral",
  running: "warn",
  complete: "ok",
  failed: "danger",
  skipped: "neutral",
};

export const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  pending: "pending",
  running: "running",
  complete: "complete",
  failed: "failed",
  skipped: "skipped",
};


export const ABSENT = "not reported";

export function formatMeasured(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return ABSENT;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return ABSENT;
    return String(value);
  }
  return value.trim().length === 0 ? ABSENT : value;
}

export function formatPctNumber(value: number): string {
  if (!Number.isFinite(value)) return ABSENT;
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatSharePct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return ABSENT;
  return `${formatPctNumber(pct)}%`;
}

export function formatDelta(
  delta: number | null | undefined,
  unit: "count" | "pct" = "count",
): string {
  if (delta === null || delta === undefined || !Number.isFinite(delta)) {
    return ABSENT;
  }
  if (delta === 0) return "0";
  const magnitude = formatPctNumber(Math.abs(delta));
  const body = unit === "pct" ? `${magnitude}%` : magnitude;
  return delta > 0 ? `+${body}` : `-${body}`;
}

export function deltaTone(delta: number | null | undefined): Tone {
  if (
    delta === null ||
    delta === undefined ||
    !Number.isFinite(delta) ||
    delta === 0
  ) {
    return "neutral";
  }
  return delta > 0 ? "ok" : "danger";
}

export function formatLatency(ms: number | null | undefined): string | null {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) {
    return null;
  }
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function isValidEvidenceHref(
  href: string | null | undefined,
): href is string {
  if (!href) return false;
  const trimmed = href.trim();
  if (trimmed.length === 0 || /\s/.test(trimmed)) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function shareOf(
  count: number | null | undefined,
  total: number | null | undefined,
): number | null {
  if (count === null || count === undefined || !Number.isFinite(count)) {
    return null;
  }
  if (total === null || total === undefined || !Number.isFinite(total)) {
    return null;
  }
  if (total <= 0) return null;
  return (count / total) * 100;
}

export function barWidthPct(
  count: number | null | undefined,
  maxCount: number | null | undefined,
): number {
  if (count === null || count === undefined || !Number.isFinite(count)) return 0;
  if (count <= 0) return 0;
  if (maxCount === null || maxCount === undefined || !Number.isFinite(maxCount)) {
    return 0;
  }
  if (maxCount <= 0) return 0;
  return Math.min(100, Math.max(0, (count / maxCount) * 100));
}


export const ICON_STROKE_WIDTH = 1.5;
export const ICON_SIZES = [14, 16, 20] as const;
export type IconSize = (typeof ICON_SIZES)[number];

export const iconProps = { strokeWidth: ICON_STROKE_WIDTH } as const;


export const LABEL_CLASS =
  "font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em]";

export const VALUE_CLASS = "font-mono tabular-nums";

export const FOCUS_RING_CLASS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)] focus-visible:ring-[3px] focus-visible:ring-[rgba(226,163,57,0.22)]";

export const PRESS_CLASS = "active:translate-y-[0.5px]";

export const STATE_TRANSITION_CLASS =
  "motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out";

export const FOCUS_MARK_CLASS =
  "bg-[var(--bg-raised-2,#191922)] ring-1 ring-[var(--accent,#e2a339)]";

export const DISPLAY_FONT_STACK =
  "var(--font-display, Fraunces, ui-serif, Georgia, serif)";

const EMPTY_COPY_BANS: readonly string[] = [
  "",
  "nothing here",
  "nothing here.",
  "no data",
  "no data.",
  "n/a",
  "-",
  "—",
  "...",
];

export function isTeachingCopy(copy: string): boolean {
  return !EMPTY_COPY_BANS.includes(copy.trim().toLowerCase());
}
