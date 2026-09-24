
export const A2UI_VERSION = "v0.9.1";
export const CATALOG_ID = "drishti/answers/v1";

export type A2UIBinding = { $tool: string; field: string };

export type A2UIComponent = {
  id: string;
  component: string;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  rows?: unknown;
  series?: unknown;
  children?: string[];
};

export type A2UIProblemCode =
  | "not-json"
  | "unknown-message"
  | "unknown-component"
  | "numeric-literal"
  | "literal-data-prop"
  | "no-root"
  | "duplicate-id"
  | "dangling-child";

export type A2UIProblem = { code: A2UIProblemCode; detail: string };

export type A2UIParseResult =
  | { ok: true; surfaceId: string; components: A2UIComponent[] }
  | { ok: false; problems: A2UIProblem[] };

export const CATALOG: Record<string, { dataProps: readonly string[]; container?: boolean }> = {
  Column: { dataProps: [], container: true },
  Bar: { dataProps: ["rows"] },
};

function findNumericLiteral(value: unknown, path: string): string | null {
  if (typeof value === "number") return path;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const hit = findNumericLiteral(value[i], `${path}[${i}]`);
      if (hit !== null) return hit;
    }
    return null;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const hit = findNumericLiteral(child, `${path}.${key}`);
      if (hit !== null) return hit;
    }
  }
  return null;
}

export function isBinding(value: unknown): value is A2UIBinding {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.$tool === "string" &&
    candidate.$tool.trim() !== "" &&
    typeof candidate.field === "string" &&
    candidate.field.trim() !== "" &&
    Object.keys(candidate).length === 2
  );
}

export function parseA2UI(text: string): A2UIParseResult {
  const problems: A2UIProblem[] = [];
  const trimmed = text.trim();
  let raw: unknown[] = [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      raw = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return { ok: false, problems: [{ code: "not-json", detail: "the block is not valid JSON" }] };
    }
  } else {
    for (const line of trimmed.split("\n")) {
      const candidate = line.trim();
      if (candidate === "") continue;
      try {
        raw.push(JSON.parse(candidate));
      } catch {
        problems.push({ code: "not-json", detail: `not valid JSON: ${candidate.slice(0, 60)}` });
      }
    }
  }
  if (problems.length > 0) return { ok: false, problems };

  let surfaceId: string | null = null;
  let components: A2UIComponent[] | null = null;

  for (const message of raw) {
    if (message === null || typeof message !== "object") {
      problems.push({ code: "unknown-message", detail: "a message must be a JSON object" });
      continue;
    }
    const numeric = findNumericLiteral(message, "message");
    if (numeric !== null) {
      problems.push({ code: "numeric-literal", detail: `${numeric} is a literal number; values must come from a tool result` });
    }
    const record = message as Record<string, unknown>;
    const known = ["createSurface", "updateComponents", "updateDataModel"];
    const present = Object.keys(record).filter((key) => known.includes(key));
    if (present.length !== 1) {
      problems.push({ code: "unknown-message", detail: `expected exactly one of ${known.join("/")}` });
      continue;
    }
    const body = record[present[0]!] as Record<string, unknown>;
    if (present[0] === "createSurface") {
      if (typeof body.surfaceId !== "string") {
        problems.push({ code: "unknown-message", detail: "createSurface needs a surfaceId" });
        continue;
      }
      surfaceId = body.surfaceId;
    } else if (present[0] === "updateComponents") {
      if (!Array.isArray(body.components)) {
        problems.push({ code: "unknown-message", detail: "updateComponents needs a components array" });
        continue;
      }
      components = body.components as A2UIComponent[];
      if (typeof body.surfaceId === "string") surfaceId = body.surfaceId;
    } else {
      problems.push({ code: "literal-data-prop", detail: "the data model is filled by the app, never authored" });
    }
  }

  if (surfaceId === null) problems.push({ code: "unknown-message", detail: "no createSurface message" });
  if (components === null) problems.push({ code: "unknown-message", detail: "no updateComponents message" });

  if (components !== null) {
    const ids = new Set<string>();
    for (const component of components) {
      if (typeof component?.id !== "string" || typeof component?.component !== "string") {
        problems.push({ code: "unknown-message", detail: "every component needs an id and a component name" });
        continue;
      }
      if (ids.has(component.id)) problems.push({ code: "duplicate-id", detail: `duplicate component id "${component.id}"` });
      ids.add(component.id);
      const entry = CATALOG[component.component];
      if (entry === undefined) {
        problems.push({ code: "unknown-component", detail: `"${component.component}" is not in the catalogue (${Object.keys(CATALOG).join(", ")})` });
        continue;
      }
      for (const prop of entry.dataProps) {
        if (!isBinding((component as Record<string, unknown>)[prop])) {
          problems.push({ code: "literal-data-prop", detail: `${component.id}.${prop} must be {"$tool","field"}, not a literal` });
        }
      }
    }
    for (const component of components) {
      for (const child of component.children ?? []) {
        if (!ids.has(child)) problems.push({ code: "dangling-child", detail: `${component.id} -> "${child}" does not exist` });
      }
    }
    if (!ids.has("root")) problems.push({ code: "no-root", detail: 'the tree needs exactly one component with id "root"' });
  }

  if (problems.length > 0 || surfaceId === null || components === null) return { ok: false, problems };
  return { ok: true, surfaceId, components };
}

export type SettledToolResult = { name: string; output: unknown };

export function settledToolResults(parts: unknown): SettledToolResult[] {
  const list = Array.isArray(parts) ? parts : [];
  const out: SettledToolResult[] = [];
  for (const part of list) {
    const candidate = part as { type?: unknown; state?: unknown; output?: unknown };
    if (typeof candidate?.type !== "string" || !candidate.type.startsWith("tool-")) continue;
    if (candidate.state !== "output-available") continue;
    if (candidate.output === undefined) continue;
    out.push({ name: candidate.type.slice("tool-".length), output: candidate.output });
  }
  return out;
}

const A2UI_FENCE_RE = /(```|~~~)a2ui[ \t]*\r?\n([\s\S]*?)\1/;

export type PersistedToolCard = { name: string; status: string; rawPayload?: unknown };

export function settledToolResultsFromCards(cards: readonly PersistedToolCard[]): SettledToolResult[] {
  const out: SettledToolResult[] = [];
  for (const card of cards) {
    if (card.status !== "complete") continue;
    const payload = (card.rawPayload ?? {}) as Record<string, unknown>;
    if (!Array.isArray(payload.facetRows)) continue;
    out.push({ name: card.name, output: { rows: payload.facetRows } });
  }
  return out;
}

export function surfaceResults(
  parts: unknown,
  cards: readonly PersistedToolCard[],
): SettledToolResult[] {
  const byTool = new Map<string, SettledToolResult>();
  for (const result of settledToolResultsFromCards(cards)) byTool.set(result.name, result);
  for (const result of settledToolResults(parts)) byTool.set(result.name, result);
  return [...byTool.values()];
}

export function splitA2UIBlock(text: string): { text: string; a2ui: string | null } {
  const match = A2UI_FENCE_RE.exec(text);
  if (match === null) return { text, a2ui: null };
  return { text: text.replace(match[0], "").replace(/\n{3,}/g, "\n\n").trim(), a2ui: (match[2] ?? "").trim() };
}

export type ResolvedNode =
  | { kind: "container"; id: string; children: ResolvedNode[] }
  | { kind: "bar"; id: string; title: string; rows: { label: string; count: number }[] }
  | { kind: "line"; id: string; title: string; series: unknown }
  | { kind: "unavailable"; id: string; title: string; reason: string };

export type ResolvedBinding =
  | { ok: true; rows: { label: string; count: number }[] }
  | { ok: true; series: unknown }
  | { ok: false; reason: string };

function facetRowsOf(output: unknown): { raw: string; count: number }[] | null {
  const rows = (output as { rows?: unknown } | null)?.rows;
  if (!Array.isArray(rows)) return null;
  const out: { raw: string; count: number }[] = [];
  for (const row of rows) {
    if (row === null || typeof row !== "object") continue;
    const candidate = row as { value?: unknown; label?: unknown; count?: unknown };
    const raw = typeof candidate.value === "string" ? candidate.value : typeof candidate.label === "string" ? candidate.label : null;
    if (raw === null || typeof candidate.count !== "number") continue;
    out.push({ raw, count: candidate.count });
  }
  return out;
}

export function resolveBinding(
  binding: A2UIBinding,
  results: SettledToolResult[],
  labelFor: (raw: string) => string | null,
): ResolvedBinding {
  const outputs = results.filter((result) => result.name === binding.$tool).map((result) => result.output);
  if (outputs.length === 0) return { ok: false, reason: `this answer did not return ${binding.$tool}` };

  if (binding.field === "*") {
    if (outputs.length > 1) {
      return { ok: false, reason: `${binding.$tool} ran ${outputs.length} times; one series cannot be bound` };
    }
    return { ok: true, series: outputs[0] };
  }
  if (binding.field !== "rows") return { ok: false, reason: `field "${binding.field}" is not readable as a chart` };

  const merged: { raw: string; count: number }[] = [];
  for (const output of outputs) {
    const rows = facetRowsOf(output);
    if (rows === null) return { ok: false, reason: `${binding.$tool} did not return countable rows` };
    merged.push(...rows);
  }
  const labelled: { label: string; count: number }[] = [];
  for (const row of merged) {
    const label = labelFor(row.raw);
    if (label === null) return { ok: false, reason: `no readable name for "${row.raw}"` };
    labelled.push({ label, count: row.count });
  }
  return { ok: true, rows: labelled };
}

export function resolveA2UI(
  parsed: Extract<A2UIParseResult, { ok: true }>,
  results: SettledToolResult[],
  labelFor: (raw: string) => string | null,
): ResolvedNode {
  const byId = new Map(parsed.components.map((component) => [component.id, component]));
  const walking = new Set<string>();

  function build(id: string): ResolvedNode {
    const component = byId.get(id);
    if (component === undefined || walking.has(id)) {
      return { kind: "unavailable", id, title: "Untitled view", reason: "the view references a component that does not exist" };
    }
    walking.add(id);
    const title = component.title ?? "Untitled view";
    let node: ResolvedNode;
    if (component.component === "Column") {
      node = { kind: "container", id, children: (component.children ?? []).map(build) };
    } else if (component.component === "Bar") {
      const resolved = resolveBinding(component.rows as A2UIBinding, results, labelFor);
      node =
        resolved.ok && "rows" in resolved
          ? { kind: "bar", id, title, rows: resolved.rows }
          : { kind: "unavailable", id, title, reason: resolved.ok ? "the rows could not be read" : resolved.reason };
    } else {
      node = { kind: "unavailable", id, title, reason: `"${component.component}" has no renderer` };
    }
    walking.delete(id);
    return node;
  }

  return build("root");
}
