
import { displayClaimText } from "../brands/format";
import { ABSENT, HOOK_TYPES, isHookType, type HookType } from "../tokens";

export type ClaimLike = {
  id: string;
  text: string;
  brandId: string;
  sourceEngine: string;
  hookType: string | null;
};

export type BrandNameById = Readonly<Record<string, string>>;

export const COHORT_SEPARATOR = ":";

export const MAX_CLAIMS_OF_DAY = 6;

export const COHORT_ENGINES = [
  "google",
  "google_ads_transparency_center",
  "youtube",
  "youtube_video",
  "google_trends",
] as const;

export const ENGINE_LABELS: Record<string, string> = {
  google: "Google Search",
  google_ads_transparency_center: "Ads Transparency",
  youtube: "YouTube Search",
  youtube_video: "YouTube Video",
  google_trends: "Google Trends",
  llm_tag: "Model tagging",
};

const COHORT_ENGINE_SET: ReadonlySet<string> = new Set<string>(COHORT_ENGINES);
const ENGINE_BY_LABEL = new Map<string, string>(
  Object.entries(ENGINE_LABELS).map(([engine, label]) => [label, engine]),
);

export function isCohortEngine(engine: string): boolean {
  return COHORT_ENGINE_SET.has(engine);
}

export function engineLabel(engine: string): string {
  return ENGINE_LABELS[engine] ?? engine;
}

export const HOOK_LABELS: Record<HookType, string> = {
  discount_offer: "discount offer",
  social_proof: "social proof",
  founder_story: "founder story",
  problem_solution: "problem and solution",
  product_feature: "product feature",
  urgency_scarcity: "urgency and scarcity",
  education_explainer: "education",
  visual_cold_open: "visual cold open",
  not_applicable: "untagged",
};

export function hookLabel(value: string): string {
  return isHookType(value) ? HOOK_LABELS[value] : value;
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return count === 1 ? singular : plural;
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatUsd(value: number | null | undefined): string {
  const finite = finiteOrNull(value);
  if (finite === null) return ABSENT;
  const fixed = finite.toFixed(4).replace(/0+$/, "");
  const [whole, decimals = ""] = fixed.split(".");
  const padded = decimals.length >= 2 ? decimals : decimals.padEnd(2, "0");
  return `$${whole}.${padded}`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatRunDate(iso: string | null | undefined): string {
  if (!iso) return ABSENT;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return ABSENT;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTHS[date.getUTCMonth()];
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${hh}:${mm} UTC`;
}

export function runHref(cohortKey: string): string {
  return `/compare/${encodeURIComponent(cohortKey)}`;
}

export function cohortKeyFromBrands(
  brands: readonly { _id: string | number }[],
): string {
  return brands
    .map((brand) => String(brand._id))
    .sort()
    .join(COHORT_SEPARATOR);
}


export type CohortCounts = {
  claimCount: number;
  engineCount: number;
  brandIds: string[];
  brandNames: string[];
  engines: string[];
};

export function cohortCounts(
  claims: readonly ClaimLike[],
  brandNameById: BrandNameById,
): CohortCounts {
  const brandIds = new Set<string>();
  const engines = new Set<string>();
  let claimCount = 0;
  for (const claim of claims) {
    if (claim.text.trim() === "") continue;
    claimCount += 1;
    if (claim.brandId !== "") brandIds.add(claim.brandId);
    if (claim.sourceEngine !== "" && claim.sourceEngine !== "llm_tag") {
      engines.add(claim.sourceEngine);
    }
  }
  const sortedBrands = [...brandIds].sort();
  const sortedEngines = [...engines].sort();
  return {
    claimCount,
    engineCount: sortedEngines.length,
    brandIds: sortedBrands,
    brandNames: sortedBrands.map((id) => brandNameById[id] ?? id),
    engines: sortedEngines,
  };
}

export function evidenceRow(counts: CohortCounts, maxNames = 2): string {
  const names = counts.brandNames;
  const brandPart =
    names.length === 0
      ? "No brands"
      : names.length <= maxNames
        ? names.join(" + ")
        : `${names.slice(0, maxNames).join(" + ")} +${names.length - maxNames}`;
  return [
    brandPart,
    `${counts.claimCount} ${pluralize(counts.claimCount, "claim")}`,
    `${counts.engineCount} ${pluralize(counts.engineCount, "engine")}`,
  ].join(" · ");
}


export type DigestMode = "brief" | "template" | "derived";

export type DigestSource = {
  brandName: string;
  text: string;
};

export type Digest = {
  mode: DigestMode;
  headline: string;
  body: string;
  sources: DigestSource[];
};

function briefLines(briefText: string | null | undefined): string[] {
  if (!briefText) return [];
  return briefText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

export function stripCitationSuffix(line: string): string {
  return line.replace(/\s*\[[^\]]*\]\s*$/, "").trim();
}

export function llmBriefSentences(briefText: string | null | undefined): string[] {
  return briefLines(briefText)
    .map((line) => stripCitationSuffix(line.replace(/^-\s*/, "")))
    .filter((line) => line !== "");
}

function groundedBody(counts: CohortCounts): string {
  if (counts.brandNames.length === 0) {
    return "No brands are in this cohort.";
  }
  return `${counts.claimCount} ${pluralize(counts.claimCount, "claim")} across ${counts.engineCount} ${pluralize(counts.engineCount, "engine")} for ${counts.brandNames.join(", ")}.`;
}

export function composeDigest(input: {
  briefText?: string | null;
  briefMode?: "llm" | "template" | null;
  claims: readonly ClaimLike[];
  brandNameById: BrandNameById;
}): Digest {
  const claims = input.claims.filter((claim) => claim.text.trim() !== "");
  const counts = cohortCounts(claims, input.brandNameById);
  const sources: DigestSource[] = [];
  const seenBrandIds = new Set<string>();
  for (const claim of claims) {
    if (seenBrandIds.has(claim.brandId)) continue;
    seenBrandIds.add(claim.brandId);
    sources.push({
      brandName: input.brandNameById[claim.brandId] ?? claim.brandId,
      text: displayClaimText(claim.text),
    });
    if (sources.length >= 2) break;
  }

  if (input.briefText && input.briefMode === "llm") {
    const sentences = llmBriefSentences(input.briefText);
    const [headline, ...rest] = sentences;
    if (headline) {
      const body = rest.slice(0, 3).join(" ");
      return {
        mode: "brief",
        headline,
        body: body !== "" ? body : groundedBody(counts),
        sources,
      };
    }
  }

  if (input.briefText && input.briefMode === "template") {
    return {
      mode: "template",
      headline: "This run has no model-written summary",
      body: "The brief pipeline ran in template mode, so this run stores its raw claim lines instead of a written digest. The sources below are claims it recorded; open the run view for the full list.",
      sources,
    };
  }

  const derived = derivedDigest(claims, counts);
  return {
    mode: "derived",
    headline: derived.headline,
    body: derived.body,
    sources,
  };
}

function derivedDigest(
  claims: readonly ClaimLike[],
  counts: CohortCounts,
): { headline: string; body: string } {
  const leading = leadingHook(claims);
  if (leading) {
    const brandCount = leading.brandIds.length;
    return {
      headline: `${hookLabel(leading.hook)} hooks lead this run`,
      body: `${leading.count} of ${leading.taggedCount} tagged ${pluralize(leading.taggedCount, "claim")} use this hook, across ${brandCount} ${pluralize(brandCount, "brand")}.`,
    };
  }
  if (counts.claimCount > 0) {
    return {
      headline: `${counts.claimCount} ${pluralize(counts.claimCount, "claim")} recorded in this run`,
      body: "No hook tags are stored for these claims yet, so there is no creative mix to summarize.",
    };
  }
  return {
    headline: "No claims recorded in this run yet",
    body: "Engines return claims; when they do, this digest names what the run found and links to the evidence behind it.",
  };
}


export type LeadingHook = {
  hook: HookType;
  count: number;
  taggedCount: number;
  brandIds: string[];
  claimIds: string[];
};

export function leadingHook(claims: readonly ClaimLike[]): LeadingHook | null {
  const tagged = claims.filter(
    (claim): claim is ClaimLike & { hookType: HookType } =>
      claim.hookType !== null &&
      isHookType(claim.hookType) &&
      claim.hookType !== "not_applicable",
  );
  if (tagged.length === 0) return null;

  const byHook = new Map<HookType, (ClaimLike & { hookType: HookType })[]>();
  for (const claim of tagged) {
    const group = byHook.get(claim.hookType) ?? [];
    group.push(claim);
    byHook.set(claim.hookType, group);
  }

  let best: { hook: HookType; group: (ClaimLike & { hookType: HookType })[] } | null =
    null;
  for (const hook of HOOK_TYPES) {
    if (hook === "not_applicable") continue;
    const group = byHook.get(hook);
    if (!group || group.length === 0) continue;
    if (best === null || group.length > best.group.length) best = { hook, group };
  }
  if (best === null) return null;

  return {
    hook: best.hook,
    count: best.group.length,
    taggedCount: tagged.length,
    brandIds: [...new Set(best.group.map((claim) => claim.brandId))].sort(),
    claimIds: best.group.map((claim) => claim.id),
  };
}

export type Emerging = {
  hook: HookType;
  hookLabelText: string;
  count: number;
  taggedCount: number;
  brandCount: number;
  brandNames: string[];
  sharePct: number;
};

export function composeEmerging(
  claims: readonly ClaimLike[],
  brandNameById: BrandNameById,
): Emerging | null {
  const leading = leadingHook(claims);
  if (leading === null) return null;
  return {
    hook: leading.hook,
    hookLabelText: hookLabel(leading.hook),
    count: leading.count,
    taggedCount: leading.taggedCount,
    brandCount: leading.brandIds.length,
    brandNames: leading.brandIds.map((id) => brandNameById[id] ?? id),
    sharePct: Math.round((leading.count / leading.taggedCount) * 100),
  };
}


export type AttentionStatus =
  | "complete"
  | "partial"
  | "failed"
  | "running"
  | "unknown";

export type AttentionGap = {
  engine: string;
  label: string;
  reason: string;
};

export type Attention = {
  status: AttentionStatus;
  errorMessage: string | null;
  gaps: AttentionGap[];
  answeredEngineCount: number;
  totalEngineCount: number;
};

export type NamedGap = {
  engine: string;
  label: string;
};

export function unavailableEnginesFromBrief(
  briefText: string | null | undefined,
): NamedGap[] {
  const out: NamedGap[] = [];
  const seen = new Set<string>();
  for (const line of briefLines(briefText)) {
    const match = line.match(/^(.+?) data unavailable this run\.$/);
    if (!match) continue;
    const label = match[1].trim();
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ engine: ENGINE_BY_LABEL.get(label) ?? label, label });
  }
  return out;
}

export function composeAttention(input: {
  runStatus?: string | null;
  errorMessage?: string | null;
  claims: readonly ClaimLike[];
  briefText?: string | null;
}): Attention {
  const answered = new Set<string>();
  for (const claim of input.claims) {
    if (claim.sourceEngine !== "llm_tag" && isCohortEngine(claim.sourceEngine)) {
      answered.add(claim.sourceEngine);
    }
  }

  const named = unavailableEnginesFromBrief(input.briefText);
  const namedByEngine = new Map(named.map((gap) => [gap.engine, gap]));

  const gaps: AttentionGap[] = [];
  for (const engine of COHORT_ENGINES) {
    if (answered.has(engine)) continue;
    const namedGap = namedByEngine.get(engine);
    gaps.push({
      engine,
      label: engineLabel(engine),
      reason: namedGap
        ? `${namedGap.label} data unavailable this run.`
        : `No claims recorded from ${engineLabel(engine)} in this run.`,
    });
  }
  for (const gap of named) {
    if (isCohortEngine(gap.engine)) continue;
    gaps.push({
      engine: gap.engine,
      label: gap.label,
      reason: `${gap.label} data unavailable this run.`,
    });
  }

  const status: AttentionStatus =
    input.runStatus === "complete" ||
    input.runStatus === "partial" ||
    input.runStatus === "failed" ||
    input.runStatus === "running"
      ? input.runStatus
      : "unknown";

  return {
    status,
    errorMessage:
      input.errorMessage && input.errorMessage.trim() !== ""
        ? input.errorMessage
        : null,
    gaps,
    answeredEngineCount: answered.size,
    totalEngineCount: COHORT_ENGINES.length,
  };
}


export type CostProvenance = "provider" | "estimated" | "unknown";

export type UsageView = {
  searches: number | null;
  credits: number | null;
  creditsReported: boolean;
  searchesLeftAfter: number | null;
  llmRequests: number | null;
  llmTokens: number | null;
  exactCostUsd: number | null;
  estimatedCostUsd: number | null;
  costProvenance: CostProvenance;
};

export function composeUsage(input: {
  requestCount?: number | null;
  creditCount?: number | null;
  creditsReported?: boolean | null;
  searchesLeftAfter?: number | null;
  llmRequestCount?: number | null;
  llmTokenCount?: number | null;
  exactCostUsd?: number | null;
  estimatedCostUsd?: number | null;
}): UsageView {
  const exactCostUsd = finiteOrNull(input.exactCostUsd);
  const estimatedCostUsd = finiteOrNull(input.estimatedCostUsd);
  const costProvenance: CostProvenance =
    exactCostUsd !== null && exactCostUsd > 0
      ? "provider"
      : estimatedCostUsd !== null && estimatedCostUsd > 0
        ? "estimated"
        : "unknown";
  return {
    searches: finiteOrNull(input.requestCount),
    credits: finiteOrNull(input.creditCount),
    creditsReported: input.creditsReported === true,
    searchesLeftAfter: finiteOrNull(input.searchesLeftAfter),
    llmRequests: finiteOrNull(input.llmRequestCount),
    llmTokens: finiteOrNull(input.llmTokenCount),
    exactCostUsd,
    estimatedCostUsd,
    costProvenance,
  };
}

export function hasReportedUsage(usage: UsageView): boolean {
  return (
    usage.searches !== null ||
    usage.searchesLeftAfter !== null ||
    usage.creditsReported ||
    usage.llmRequests !== null ||
    usage.llmTokens !== null ||
    (usage.exactCostUsd !== null && usage.exactCostUsd > 0) ||
    (usage.estimatedCostUsd !== null && usage.estimatedCostUsd > 0)
  );
}


export type ClaimFeedItem = {
  id: string;
  text: string;
  brandName: string;
  hookType: HookType | null;
  engine: string;
  engineLabelText: string;
};

export type ClaimFeed = {
  items: ClaimFeedItem[];
  total: number;
  bounded: boolean;
};

export function buildClaimFeed(
  claims: readonly ClaimLike[],
  brandNameById: BrandNameById,
  limit = MAX_CLAIMS_OF_DAY,
): ClaimFeed {
  const clean = claims.filter((claim) => claim.text.trim() !== "");
  const items = clean.slice(0, Math.max(0, limit)).map((claim) => ({
    id: claim.id,
    text: displayClaimText(claim.text),
    brandName: brandNameById[claim.brandId] ?? claim.brandId,
    hookType:
      claim.hookType !== null && isHookType(claim.hookType)
        ? claim.hookType
        : null,
    engine: claim.sourceEngine,
    engineLabelText: engineLabel(claim.sourceEngine),
  }));
  return {
    items,
    total: clean.length,
    bounded: clean.length > items.length,
  };
}
