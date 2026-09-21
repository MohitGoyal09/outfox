import type { HookType } from "@/components/drishti";
import type { Doc } from "@/convex/_generated/dataModel";

export type RunDoc = Doc<"runs">;
export type BrandDoc = Doc<"brands">;
export type ClaimDoc = Doc<"claims">;
export type SnapshotDoc = Doc<"snapshots">;
export type BriefDoc = Doc<"briefs">;
export type UsageSummary = Doc<"llmUsage">;

export type RunLike = {
  _id: string;
  cohortKey: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
};

export type BrandRef = {
  id: string;
  name: string;
};

export type RunStatus = "running" | "complete" | "partial" | "failed";

export type EngineStatus = "ok" | "failed" | "unavailable";

export type EngineCellStatus = EngineStatus | "missing";

export type EngineCell = {
  brandId: string;
  brandName: string;
  status: EngineCellStatus;
  reason: string | null;
};

export type EngineRow = {
  engine: string;
  label: string;
  cells: EngineCell[];
  okCount: number;
  gap: EngineCellStatus | null;
};

export type EngineGap = {
  engine: string;
  label: string;
  status: EngineCellStatus;
  reason: string;
};

export type TrailFilters = {
  engine: string | null;
  brandId: string | null;
};

export type TrailFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type BriefSegment =
  | { kind: "text"; text: string }
  | { kind: "cite"; ids: string[]; numbers: number[]; resolvable: boolean };

export type RawClaimLine = {
  text: string;
  brandName: string;
  metric: string;
  value: string | null;
  href: string | null;
};

export type TemplateSection = {
  heading: string;
  lines: RawClaimLine[];
};

export type BriefComposition = {
  kind: "llm" | "template" | "empty";
  mode: "llm" | "template" | null;
  paragraphs: BriefSegment[][];
  sections: TemplateSection[];
  unavailable: string[];
  notice: string | null;
};

export type ChangeSummary =
  | {
      kind: "no-previous";
      cohortClaimCount: number;
      cohortEngineCount: number;
      brandCounts: { brandId: string; brandName: string; claims: number }[];
    }
  | {
      kind: "no-change";
      previousAt: string;
      cohortClaimCount: number;
      tagCount: number;
    }
  | {
      kind: "change";
      brandId: string;
      brandName: string;
      hook: HookType;
      before: number;
      after: number;
      delta: number;
      brandClaimCount: number;
      cohortClaimCount: number;
      tagCount: number;
      previousAt: string;
    };

export type ChangeCopy = {
  headline: string;
  body: string;
  facts: string[];
};

export type CostProvenance = "exact" | "estimated" | "mixed" | "unknown";

export type TrailFocus = {
  claimId: string;
  brandId: string | null;
};
