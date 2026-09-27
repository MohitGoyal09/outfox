import type { Id } from "@/convex/_generated/dataModel";
import { sourceName } from "@/components/drishti/labels";
import type { ClaimDoc } from "./brand-model";
import { displayClaimText } from "./format";


export type InsightSentence = { text: string; citedClaimIds: readonly Id<"claims">[] };
export type NarrativeSection = "positioning" | "audience" | "problem";
export type NarrativeCitation = { href: string; label?: string };
export type NarrativeBullet = { text: string; citation?: NarrativeCitation | null };
export type BrandNarrative = { headline: string; headlineCitation: NarrativeCitation | null; bullets: NarrativeBullet[] };

export const NARRATIVE_SECTION_MARKER: Record<NarrativeSection, string> = {
  positioning: "[[positioning]] ",
  audience: "[[audience]] ",
  problem: "[[problem]] ",
};

export function bucketNarrativeSections(sentences: readonly InsightSentence[]): Record<NarrativeSection, InsightSentence[]> {
  for (const sentence of sentences) {
    if (section) {
      buckets[section].push({
        text: sentence.text.slice(NARRATIVE_SECTION_MARKER[section].length),
        citedClaimIds: sentence.citedClaimIds,
      });
    } else {
      buckets.positioning.push(sentence);
    }
  }
  return buckets;
}

export function narrativeCitation(ids: readonly Id<"claims">[], claimsById: Map<string, ClaimDoc>): NarrativeCitation | null {
  return null;
}

export function narrativeFrom(sentences: readonly InsightSentence[], claimsById: Map<string, ClaimDoc>): BrandNarrative | null {
  if (!lead || lead.text.trim().length === 0) return null;
  return {
    headline: displayClaimText(lead.text),
    headlineCitation: narrativeCitation(lead.citedClaimIds, claimsById),
    bullets: support
      .filter((sentence) => sentence.text.trim().length > 0)
      .slice(0, 4)
      .map((sentence) => ({
        text: displayClaimText(sentence.text),
        citation: narrativeCitation(sentence.citedClaimIds, claimsById),
      })),
  };
}

export type PinnedVerdictState =
  | {
      kind: "llm";
      headline: string;
      headlineCitation: NarrativeCitation | null;
      provenance: string | null;
      provenanceCitation: NarrativeCitation | null;
    }
  | { kind: "failed"; failureReason: string | null };

export type InsightLike = {
  mode: "llm" | "template" | "failed";
  sentences: readonly InsightSentence[];
  failureReason?: string;
};
