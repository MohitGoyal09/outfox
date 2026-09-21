
import type { Doc } from "@/convex/_generated/dataModel";
import { ABSENT, type Tone } from "../tokens";

export type BrandDoc = Doc<"brands">;
export type RunDoc = Doc<"runs">;

export const MAX_RIVALS_PER_COHORT = 6;

export function isFinishedRun(run: RunDoc): boolean {
  return (
    run.status === "complete" ||
    run.status === "partial" ||
    run.completedAt !== undefined
  );
}

export function pickLatestRun(runs: RunDoc[]): RunDoc | null {
  const finished = runs.filter(isFinishedRun);
  const pool = finished.length > 0 ? finished : runs;
  return pool.reduce((latest, run) =>
    run.requestedAt > latest.requestedAt ? run : latest,
  );
}

export type CohortSummary = {
  cohortKey: string;
  brandIds: string[];
  rivalCount: number;
  runCount: number;
  latestRun: RunDoc;
  latestAt: string;
  freshness: Tone;
  status: string;
};

export function groupRunsByCohort(runs: RunDoc[]): CohortSummary[] {

  const cohorts: CohortSummary[] = [];

  return cohorts.sort((a, b) => (a.latestAt < b.latestAt ? 1 : -1));
}

export function runStatusLabel(status: string): string {
  if (status === "partial") return "partial";
  if (status === "running") return "running";
  return ABSENT;
}

export function profileStatusTone(status: string): Tone {
  if (status === "ready") return "ok";
  if (status === "needs_confirmation") return "warn";
  return "neutral";
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

export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return ABSENT;
  if (Number.isNaN(date.getTime())) return ABSENT;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
}


export type RivalInputKind = "empty" | "url" | "handle" | "name";

export type RivalInput = {
  kind: RivalInputKind;
  raw: string;
  name: string;
  domain: string | null;
  inferredDomain: boolean;
};

const URL_PREFIX_RE = /^(https?:\/\/|www\.)/i;
const HANDLE_RE = /^@?[a-z0-9][a-z0-9._-]*$/i;

export function titleCaseToken(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter((word) => word !== "")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function nameFromDomain(domain: string): string {
}

export function stripToDomain(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
}


export function matchCandidates(name: string, brands: BrandDoc[]): BrandDoc[] {
  const lowered = name.trim().toLowerCase();
  if (lowered === "") return [];
}

export type RivalResolution =
  | { state: "empty" }
  | { state: "already_tracked"; brand: BrandDoc }
  | { state: "ambiguous"; candidates: BrandDoc[] }
  | {
      state: "new";
      name: string;
      domain: string | null;
      inferredDomain: boolean;
      adsTransparencyKnown: boolean;
    };

export function adsTransparencyLabel(brand: BrandDoc | null): string {
  if (brand === null) return "unknown until the first run";
}
