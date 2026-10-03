import { tagsForClaim, tagsForGroup, type ClaimDoc, type YoutubeVideoGroup } from "./brand-model";

export type EvidenceRow = {
  id: string;
  engine: string;
  text: string;
  url: string;
  hook?: string;
  stage?: string;
  value?: string | number;
  unit?: string;
  fetchedAt: string;
};

export type EvidenceRowKey = "engine" | "value" | "fetchedAt";

export function compareAbsentLast(a: string | number | null | undefined, b: string | number | null | undefined, dir: "asc" | "desc"): number {
  const aAbsent = a === undefined || a === null || a === "";
  const base =
    typeof a === "number" && typeof b === "number"
      ? a - b
      : typeof a === "number"
        ? -1
        : typeof b === "number"
          ? 1
          : String(a).localeCompare(String(b));
}

export function sortEvidenceRows(rows: EvidenceRow[], key: EvidenceRowKey, dir: "asc" | "desc"): EvidenceRow[] {
  return [...rows].sort((a, b) => compareAbsentLast(a[key], b[key], dir));
}

export function formatRowValue(row: Pick<EvidenceRow, "value" | "unit">): string {
}

function firstTag(tags: ClaimDoc[], pick: "hookType" | "funnelStage"): string | undefined {
  return tags.find((tag) => tag[pick] !== undefined)?.[pick];
}

export function claimRow(claim: ClaimDoc, allTags: ClaimDoc[]): EvidenceRow {
}
