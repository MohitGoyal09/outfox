import {
  FUNNEL_STAGES,
  HOOK_TYPES,
  formatDelta,
  isValidEvidenceHref,
  shareOf,
  type DistributionItem,
  type FunnelStage,
  type HookType,
  type TrailGap,
  type TrailStep,
} from "@/components/drishti";
import {
  computeCreativeMix,
  diffMix,
  type CreativeMix,
  type MixDelta,
} from "@/convex/pipeline/rollup";
import {
  ENGINE_STATUS_WORD,
  FETCH_ENGINES,
  HOOK_WORD,
  engineLabel,
  formatRunDateTime,
  formatRunDayMonth,
  isTerminalRunStatus,
} from "./labels";
import type {
  BrandRef,
  BriefComposition,
  BriefSegment,
  ChangeCopy,
  ChangeSummary,
  ClaimDoc,
  EngineCellStatus,
  EngineGap,
  EngineRow,
  RawClaimLine,
  RunLike,
  SnapshotDoc,
  TemplateSection,
  TrailFilterOption,
} from "./types";


export function brandNameMap(
  brands: readonly { _id: string; name: string }[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const brand of brands ?? []) map.set(String(brand._id), brand.name);
  return map;
}

export function brandRefs(
  brandIds: readonly string[],
  names: Map<string, string>,
): BrandRef[] {
  return brandIds.map((id) => ({ id, name: names.get(id) ?? id.slice(0, 8) }));
}

export function cohortLabel(
  brandIds: readonly string[],
  names: Map<string, string>,
): string {
  return brandIds
    .map((id) => names.get(id) ?? id.slice(0, 8))
    .join(" · ");
}

export function sortRunsNewestFirst<T extends { _id: string; requestedAt: string }>(
  runs: readonly T[],
): T[] {
  return [...runs].sort((a, b) => {
    if (a.requestedAt !== b.requestedAt) return a.requestedAt < b.requestedAt ? 1 : -1;
    return a._id < b._id ? 1 : -1;
  });
}

export function mergeRuns<T extends { _id: string }>(
  groups: readonly (readonly T[] | undefined)[],
): T[] {
  const seen = new Map<string, T>();
  for (const group of groups) {
    for (const run of group ?? []) {
      if (!seen.has(run._id)) seen.set(run._id, run);
    }
  }
  return [...seen.values()];
}

export function selectPreviousRun<T extends RunLike>(
  runs: readonly T[],
  current: RunLike,
): T | null {
  let best: T | null = null;
  for (const run of runs) {
    if (run._id === current._id) continue;
    if (run.cohortKey !== current.cohortKey) continue;
    if (!isTerminalRunStatus(run.status) || run.status === "running") continue;
    if (run.requestedAt >= current.requestedAt) continue;
    if (best === null || run.requestedAt > best.requestedAt) best = run;
  }
  return best;
}


function engineRank(status: EngineCellStatus): number {
  if (status === "failed") return 3;
  if (status === "unavailable") return 2;
  if (status === "missing") return 1;
  return 0;
}

export function engineRows(
  snapshots: readonly SnapshotDoc[] | undefined,
  brands: readonly BrandRef[],
): EngineRow[] {
  const byEngine = new Map<string, Map<string, { status: EngineCellStatus; reason: string | null }>>();
  for (const snapshot of snapshots ?? []) {
    if (snapshot.engine === "llm_tag") continue;
    const engine = snapshot.engine;
    let cells = byEngine.get(engine);
    if (cells === undefined) {
      cells = new Map<string, { status: EngineCellStatus; reason: string | null }>();
      byEngine.set(engine, cells);
    }
    const brandId = String(snapshot.brandId);
    const status: EngineCellStatus = snapshot.status;
    const reason = snapshot.status === "ok" ? null : (snapshot.errorMessage ?? null);
    const existing = cells.get(brandId);
    if (existing === undefined || engineRank(status) > engineRank(existing.status)) {
      cells.set(brandId, { status, reason });
    }
  }

  const present = [...byEngine.keys()];
  const ordered = [
    ...FETCH_ENGINES.filter((engine) => byEngine.has(engine)),
    ...present.filter((engine) => !(FETCH_ENGINES as readonly string[]).includes(engine)),
  ];

  return ordered.map((engine) => {
    const cells = byEngine.get(engine);
    const rows = brands.map((brand) => {
      const hit = cells?.get(brand.id);
      return {
        brandId: brand.id,
        brandName: brand.name,
        status: hit?.status ?? ("missing" as EngineCellStatus),
        reason: hit?.reason ?? null,
      };
    });
    const gap = rows.reduce<EngineCellStatus>(
      (worst, cell) => (engineRank(cell.status) > engineRank(worst) ? cell.status : worst),
      "ok",
    );
    return {
      engine,
      label: engineLabel(engine),
      cells: rows,
      okCount: rows.filter((cell) => cell.status === "ok").length,
      gap: gap === "ok" ? null : gap,
    };
  });
}

function gapReason(status: EngineCellStatus, stored: string | null): string {
  if (stored !== null && stored.trim() !== "") return stored;
  if (status === "failed") return "The engine call failed and no claims were stored.";
  if (status === "unavailable") return "The engine did not run for this cohort.";
  return "No snapshot was recorded for this brand in this run.";
}

export function engineGaps(rows: readonly EngineRow[]): EngineGap[] {
  const gaps: EngineGap[] = [];
  for (const row of rows) {
    if (row.gap === null) continue;
    const stored = row.cells.find((cell) => cell.status !== "ok" && cell.reason !== null);
    gaps.push({
      engine: row.engine,
      label: row.label,
      status: row.gap,
      reason: gapReason(row.gap, stored?.reason ?? null),
    });
  }
  return gaps;
}

export function engineGapLabels(gaps: readonly EngineGap[]): string[] {
  return gaps.map((gap) => `${gap.label} ${ENGINE_STATUS_WORD[gap.status]}`);
}


export function taggedClaims(claims: readonly ClaimDoc[]): ClaimDoc[] {
  return claims.filter(
    (claim) => claim.hookType !== undefined || claim.funnelStage !== undefined,
  );
}

function taggable(claims: readonly ClaimDoc[]) {
  return claims.map((claim) => ({
    hookType: claim.hookType ?? null,
    funnelStage: claim.funnelStage ?? null,
  }));
}

export function mixForBrand(
  claims: readonly ClaimDoc[],
  brandId: string,
): CreativeMix {
  return computeCreativeMix(
    taggable(taggedClaims(claims).filter((claim) => String(claim.brandId) === brandId)),
  );
}

export function mixForCohort(claims: readonly ClaimDoc[]): CreativeMix {
  return computeCreativeMix(taggable(taggedClaims(claims)));
}

export function hookDeltas(prev: CreativeMix, curr: CreativeMix): MixDelta[] {
  return diffMix(prev, curr);
}

export type FunnelDelta = {
  stage: FunnelStage;
  before: number;
  after: number;
  delta: number;
};

export function funnelDeltas(prev: CreativeMix, curr: CreativeMix): FunnelDelta[] {
  return FUNNEL_STAGES.map((stage) => {
    const before = prev.funnels[stage] ?? 0;
    const after = curr.funnels[stage] ?? 0;
    return { stage, before, after, delta: after - before };
  });
}

export type HookLeader = { hook: HookType; count: number; sharePct: number };
export type FunnelLeader = { stage: FunnelStage; count: number; sharePct: number };

export function leadingHook(mix: CreativeMix, excludeUntagged = false): HookLeader | null {
  let best: HookLeader | null = null;
  for (const hook of Object.keys(mix.hooks) as HookType[]) {
    if (excludeUntagged && hook === "not_applicable") continue;
    const count = mix.hooks[hook];
    if (count <= 0) continue;
    if (best === null || count > best.count) {
      best = { hook, count, sharePct: shareOf(count, mix.total) ?? 0 };
    }
  }
  return best;
}

export function leadingFunnel(mix: CreativeMix, excludeUntagged = false): FunnelLeader | null {
  let best: FunnelLeader | null = null;
  for (const stage of FUNNEL_STAGES) {
    if (excludeUntagged && stage === "not_applicable") continue;
    const count = mix.funnels[stage];
    if (count <= 0) continue;
    if (best === null || count > best.count) {
      best = { stage, count, sharePct: shareOf(count, mix.total) ?? 0 };
    }
  }
  return best;
}

export function hookDistributionItems(
  curr: CreativeMix,
  prev: CreativeMix | null,
): DistributionItem[] {
  const deltas = prev === null ? null : hookDeltas(prev, curr);
  return HOOK_TYPES.map((hook, index) => ({
    label: hook,
    count: curr.hooks[hook],
    sharePct: shareOf(curr.hooks[hook], curr.total),
    delta: deltas === null ? null : (deltas[index]?.delta ?? null),
    deltaUnit: "count",
  }));
}

export function funnelDistributionItems(
  curr: CreativeMix,
  prev: CreativeMix | null,
): DistributionItem[] {
  const deltas = prev === null ? null : funnelDeltas(prev, curr);
  return FUNNEL_STAGES.map((stage, index) => ({
    label: stage,
    count: curr.funnels[stage],
    sharePct: shareOf(curr.funnels[stage], curr.total),
    delta: deltas === null ? null : (deltas[index]?.delta ?? null),
    deltaUnit: "count",
  }));
}

export type BrandMixSummary = {
  brandId: string;
  brandName: string;
  claimCount: number;
  tagCount: number;
  hook: HookLeader | null;
  funnel: FunnelLeader | null;
  hookChange: MixDelta | null;
  funnelChange: FunnelDelta | null;
  claimDelta: number | null;
  tagDelta: number | null;
};

function biggestHookChange(rows: readonly MixDelta[]): MixDelta | null {
  let best: MixDelta | null = null;
  for (const row of rows) {
    if (row.hook === "not_applicable" || row.delta === 0) continue;
    if (best === null || Math.abs(row.delta) > Math.abs(best.delta)) best = row;
  }
  return best;
}

function biggestFunnelChange(rows: readonly FunnelDelta[]): FunnelDelta | null {
  let best: FunnelDelta | null = null;
  for (const row of rows) {
    if (row.stage === "not_applicable" || row.delta === 0) continue;
    if (best === null || Math.abs(row.delta) > Math.abs(best.delta)) best = row;
  }
  return best;
}

export function brandMixSummaries(input: {
  brands: readonly BrandRef[];
  currentClaims: readonly ClaimDoc[];
  previousClaims: readonly ClaimDoc[] | null;
}): BrandMixSummary[] {
  const { brands, currentClaims, previousClaims } = input;
  return brands.map((brand) => {
    const current = currentClaims.filter(
      (claim) => String(claim.brandId) === brand.id,
    );
    const currentMix = mixForBrand(currentClaims, brand.id);
    const hookChange =
      previousClaims === null
        ? null
        : biggestHookChange(hookDeltas(mixForBrand(previousClaims, brand.id), currentMix));
    const funnelChange =
      previousClaims === null
        ? null
        : biggestFunnelChange(
            funnelDeltas(mixForBrand(previousClaims, brand.id), currentMix),
          );
    const previous = previousClaims?.filter(
      (claim) => String(claim.brandId) === brand.id,
    );
    const currentTagged = taggedClaims(current).length;
    const previousTagged = previous === undefined ? null : taggedClaims(previous).length;
    return {
      brandId: brand.id,
      brandName: brand.name,
      claimCount: current.length,
      tagCount: currentTagged,
      hook: leadingHook(currentMix, true) ?? leadingHook(currentMix),
      funnel: leadingFunnel(currentMix, true) ?? leadingFunnel(currentMix),
      hookChange,
      funnelChange,
      claimDelta: previous === undefined ? null : current.length - previous.length,
      tagDelta: previousTagged === null ? null : currentTagged - previousTagged,
    };
  });
}


export type HookChange = {
  brandId: string;
  brandName: string;
  hook: HookType;
  before: number;
  after: number;
  delta: number;
};

export function biggestCohortHookChange(
  brands: readonly BrandRef[],
  currentClaims: readonly ClaimDoc[],
  previousClaims: readonly ClaimDoc[],
): HookChange | null {
  let best: HookChange | null = null;
  for (const brand of brands) {
    const rows = hookDeltas(
      mixForBrand(previousClaims, brand.id),
      mixForBrand(currentClaims, brand.id),
    );
    for (const row of rows) {
      if (row.hook === "not_applicable" || row.delta === 0) continue;
      if (best === null || Math.abs(row.delta) > Math.abs(best.delta)) {
        best = {
          brandId: brand.id,
          brandName: brand.name,
          hook: row.hook,
          before: row.before,
          after: row.after,
          delta: row.delta,
        };
      }
    }
  }
  return best;
}

export function deriveChange(input: {
  brands: readonly BrandRef[];
  currentClaims: readonly ClaimDoc[];
  previousClaims: readonly ClaimDoc[] | null;
  previousAt: string | null;
  engineCount: number;
}): ChangeSummary {
  const { brands, currentClaims, previousClaims, previousAt, engineCount } = input;
  const tagCount = taggedClaims(currentClaims).length;

  if (previousClaims === null || previousAt === null) {
    return {
      kind: "no-previous",
      cohortClaimCount: currentClaims.length,
      cohortEngineCount: engineCount,
      brandCounts: brands.map((brand) => ({
        brandId: brand.id,
        brandName: brand.name,
        claims: currentClaims.filter((claim) => String(claim.brandId) === brand.id).length,
      })),
    };
  }

  const change = biggestCohortHookChange(brands, currentClaims, previousClaims);
  if (change === null) {
    return {
      kind: "no-change",
      previousAt,
      cohortClaimCount: currentClaims.length,
      tagCount,
    };
  }
  return {
    kind: "change",
    ...change,
    brandClaimCount: currentClaims.filter(
      (claim) => String(claim.brandId) === change.brandId,
    ).length,
    cohortClaimCount: currentClaims.length,
    tagCount,
    previousAt,
  };
}

export function changeCopy(change: ChangeSummary): ChangeCopy {
  if (change.kind === "no-previous") {
    const rivals = change.brandCounts.length;
    return {
      headline: "A second run is what produces a delta.",
      body:
        `This is the first recorded comparison for this cohort, so there is ` +
        `nothing to measure it against yet. Run the cohort again and this panel ` +
        `names the rival that moved and by how much.`,
      facts: [
        `${rivals} ${rivals === 1 ? "rival" : "rivals"}`,
        `${change.cohortClaimCount} claims`,
        `${change.cohortEngineCount} engines returned`,
      ],
    };
  }

  if (change.kind === "no-change") {
    return {
      headline: `No hook moved since the run of ${formatRunDayMonth(change.previousAt)}.`,
      body:
        `Every rival's hook counts match the previous run. A run that looks the ` +
        `same as the last one still tells you something: this cohort's public ` +
        `signals held steady.`,
      facts: [
        `${change.cohortClaimCount} claims`,
        `${change.tagCount} content tags`,
        "0 hook changes",
      ],
    };
  }

  const word = HOOK_WORD[change.hook];
  const direction = change.delta > 0 ? "toward" : "away from";
  return {
    headline: `${change.brandName} moved ${direction} ${word} hooks.`,
    body:
      `This run has ${change.after} ${word} ${change.after === 1 ? "claim" : "claims"} ` +
      `for ${change.brandName}; the run of ${formatRunDayMonth(change.previousAt)} ` +
      `had ${change.before}. Across the cohort, ${change.tagCount} of ` +
      `${change.cohortClaimCount} claims carry a content tag.`,
    facts: [
      change.brandName,
      `${change.brandClaimCount} claims`,
      `${formatDelta(change.delta)} ${change.hook}`,
    ],
  };
}


const PROSE_METRICS: ReadonlySet<string> = new Set([
  "youtube_video_title",
  "youtube_video_description",
]);

export function claimValue(claim: ClaimDoc): string | number | null {
  const value = claim.value;
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    return claim.unit ? `${value} ${claim.unit}` : value;
  }
  if (PROSE_METRICS.has(claim.metric ?? "")) return null;
  return value;
}

export function claimToTrailStep(
  claim: ClaimDoc,
  brandName: string,
): TrailStep {
  return {
    id: String(claim._id),
    label: `${brandName} · ${engineLabel(claim.sourceEngine)}`,
    value: claimValue(claim),
    reasoning: `Query "${claim.sourceQuery}" returned: ${claim.text}`,
    tone: isValidEvidenceHref(claim.evidenceUrl) ? "ok" : "neutral",
    href: claim.evidenceUrl,
    meta: { at: formatRunDateTime(claim.fetchedAt) },
  };
}

export function buildTrailSteps(
  claims: readonly ClaimDoc[],
  names: Map<string, string>,
): TrailStep[] {
  return claims.map((claim) =>
    claimToTrailStep(claim, names.get(String(claim.brandId)) ?? "brand"),
  );
}

export function filterClaims(
  claims: readonly ClaimDoc[],
  filters: { engine: string | null; brandId: string | null },
): ClaimDoc[] {
  return claims.filter((claim) => {
    if (filters.engine !== null && claim.sourceEngine !== filters.engine) return false;
    if (filters.brandId !== null && String(claim.brandId) !== filters.brandId) return false;
    return true;
  });
}

export function trailFilterOptions(
  claims: readonly ClaimDoc[],
  brands: readonly BrandRef[],
): { engines: TrailFilterOption[]; brands: TrailFilterOption[] } {
  const engineCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();
  for (const claim of claims) {
    engineCounts.set(claim.sourceEngine, (engineCounts.get(claim.sourceEngine) ?? 0) + 1);
    const brandId = String(claim.brandId);
    brandCounts.set(brandId, (brandCounts.get(brandId) ?? 0) + 1);
  }
  const present = [...engineCounts.keys()];
  const engineOrder = [
    ...FETCH_ENGINES.filter((engine) => engineCounts.has(engine)),
    ...present.filter((engine) => !(FETCH_ENGINES as readonly string[]).includes(engine)),
  ];
  return {
    engines: engineOrder.map((engine) => ({
      value: engine,
      label: engineLabel(engine),
      count: engineCounts.get(engine) ?? 0,
    })),
    brands: brands
      .filter((brand) => brandCounts.has(brand.id))
      .map((brand) => ({
        value: brand.id,
        label: brand.name,
        count: brandCounts.get(brand.id) ?? 0,
      })),
  };
}

export function trailGaps(gaps: readonly EngineGap[]): TrailGap[] {
  return gaps.map((gap) => ({
    id: `gap:${gap.engine}`,
    label: gap.label,
    reason: `${ENGINE_STATUS_WORD[gap.status]}: ${gap.reason}`,
  }));
}


const UNAVAILABLE_LINE = /data unavailable this run\.?$/i;

type RawSegment = { kind: "text"; text: string } | { kind: "cite"; ids: string[] };

function parseLlmLine(line: string): {
  segments: RawSegment[];
  unavailable: boolean;
} {
  const body = line.replace(/^[-*]\s*/, "").trim();
  if (UNAVAILABLE_LINE.test(body) && !body.includes("[")) {
    return { segments: [], unavailable: true };
  }
  const segments: RawSegment[] = [];
  const pattern = /\[([^\]]*)\]/g;
  let cursor = 0;
  let match = pattern.exec(body);
  while (match !== null) {
    const text = body.slice(cursor, match.index).trim();
    if (text !== "") segments.push({ kind: "text", text });
    const ids = match[1]
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id !== "");
    if (ids.length > 0) segments.push({ kind: "cite", ids });
    cursor = match.index + match[0].length;
    match = pattern.exec(body);
  }
  const tail = body.slice(cursor).trim();
  if (tail !== "") segments.push({ kind: "text", text: tail });
  return { segments, unavailable: false };
}

function parseBracketRef(bracket: string): {
  brand: string;
  metric: string;
  value: string | null;
} {
  const pipe = bracket.indexOf("|");
  if (pipe < 0) return { brand: bracket.trim(), metric: "", value: null };
  const brand = bracket.slice(0, pipe).trim();
  const rest = bracket.slice(pipe + 1).trim();
  const withValue = rest.match(/^(.+?)\s*\(([^)]*)\)$/);
  if (withValue === null) return { brand, metric: rest, value: null };
  return { brand, metric: withValue[1].trim(), value: withValue[2].trim() || null };
}

function parseTemplateLine(line: string): RawClaimLine {
  const body = line.replace(/^[-*]\s*/, "").trim();
  const bracket = body.match(/^\[([^\]]*)\]\s*([\s\S]*)$/);
  if (bracket === null) {
    return { text: body, brandName: "", metric: "", value: null, href: null };
  }
  const ref = parseBracketRef(bracket[1]);
  const remainder = bracket[2].trim();
  const link = remainder.match(/^([\s\S]*?)\s*\(([^()\s]+)\)\s*$/);
  const text = link === null ? remainder : link[1].trim();
  const hrefCandidate = link === null ? null : link[2].trim();
  return {
    text: text === "" ? body : text,
    brandName: ref.brand,
    metric: ref.metric,
    value: ref.value,
    href: isValidEvidenceHref(hrefCandidate) ? hrefCandidate : null,
  };
}

function dedupeLines(lines: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = line.trim().toLowerCase();
    if (key === "" || seen.has(key)) continue;
    seen.add(key);
    out.push(line.trim());
  }
  return out;
}

export function composeBrief(input: {
  briefText: string | null | undefined;
  mode: "llm" | "template" | null;
  claims: readonly ClaimDoc[];
  gaps: readonly EngineGap[];
}): BriefComposition {
  const text = (input.briefText ?? "").trim();
  const fromStatus = input.gaps.map(
    (gap) => `${gap.label} data unavailable this run.`,
  );

  if (text === "") {
    return {
      kind: "empty",
      mode: input.mode,
      paragraphs: [],
      sections: [],
      unavailable: dedupeLines(fromStatus),
      notice: null,
    };
  }

  const lines = text.split("\n").map((line) => line.trim());

  if (input.mode === "template") {
    const sections: TemplateSection[] = [];
    const detected: string[] = [];
    let current: TemplateSection | null = null;
    for (const line of lines) {
      if (line === "") continue;
      if (line.startsWith("##")) {
        current = { heading: line.replace(/^#+\s*/, "").trim(), lines: [] };
        sections.push(current);
        continue;
      }
      if (UNAVAILABLE_LINE.test(line) && !line.includes("[")) {
        detected.push(line);
        continue;
      }
      const parsed = parseTemplateLine(line);
      if (current === null) {
        current = { heading: "Claims", lines: [] };
        sections.push(current);
      }
      current.lines.push(parsed);
    }
    return {
      kind: "template",
      mode: "template",
      paragraphs: [],
      sections,
      unavailable: dedupeLines([...fromStatus, ...detected]),
      notice:
        "The model did not write this run's brief. These are the raw claims it " +
        "would have summarised, grouped by rival.",
    };
  }

  const known = new Set(input.claims.map((claim) => String(claim._id)));
  const raw: RawSegment[][] = [];
  const detected: string[] = [];
  for (const line of lines) {
    if (line === "") continue;
    const parsed = parseLlmLine(line);
    if (parsed.unavailable) {
      detected.push(line);
      continue;
    }
    if (parsed.segments.length > 0) raw.push(parsed.segments);
  }

  const unavailable = dedupeLines([...fromStatus, ...detected]);
  if (raw.length === 0) {
    return {
      kind: "empty",
      mode: input.mode,
      paragraphs: [],
      sections: [],
      unavailable,
      notice: null,
    };
  }

  const numbers = new Map<string, number>();
  let next = 1;
  for (const paragraph of raw) {
    for (const segment of paragraph) {
      if (segment.kind !== "cite") continue;
      for (const id of segment.ids) {
        if (!numbers.has(id)) numbers.set(id, next++);
      }
    }
  }

  const paragraphs: BriefSegment[][] = raw.map((paragraph) =>
    paragraph.map((segment) => {
      if (segment.kind === "text") return segment;
      return {
        kind: "cite",
        ids: segment.ids,
        numbers: segment.ids.map((id) => numbers.get(id) ?? 0),
        resolvable: segment.ids.every((id) => known.has(id)),
      };
    }),
  );

  return {
    kind: "llm",
    mode: "llm",
    paragraphs,
    sections: [],
    unavailable,
    notice: null,
  };
}
