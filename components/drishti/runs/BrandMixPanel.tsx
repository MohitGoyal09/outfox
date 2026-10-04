"use client";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DistributionPanel } from "@/components/drishti";
import { hookName, stageName } from "@/components/drishti/labels";
import {
  countFindings,
  funnelDistributionItems,
  hookDistributionItems,
  clearHooks,
  clearStages,
  mixForBrand,
  taggedClaims,
  unclearFootnote,
  unclearHooks,
  unclearStages,
} from "./derive";
import type { BrandRef } from "./types";

export type BrandMixPanelProps = {
  brand: BrandRef;
  kind: "hook" | "funnel";
  runId: Id<"runs">;
  previousRunId: Id<"runs"> | null;
  previousLabel: string;
};

export function BrandMixPanel({
  brand,
  kind,
  runId,
  previousRunId,
  previousLabel,
}: BrandMixPanelProps) {
  const current = useQuery(api.claims.byRunAndBrand, {
    runId,
    brandId: brand.id as Id<"brands">,
  });
  const previous = useQuery(
    api.claims.byRunAndBrand,
    previousRunId === null
      ? "skip"
      : { runId: previousRunId, brandId: brand.id as Id<"brands"> },
  );

  const loading =
    current === undefined || (previousRunId !== null && previous === undefined);
  const currentMix = mixForBrand(current ?? [], brand.id);
  const previousMix =
    previousRunId === null ? null : mixForBrand(previous ?? [], brand.id);

  return (
    <DistributionPanel
      kind={kind}
      title={brand.name}
      summaryLabel={`${taggedClaims(current ?? []).length} tagged of ${countFindings(current ?? [])} findings`}
      previousLabel={previousLabel}
      previousInfo="Change in share, in percentage points (pp), since the previous run."
      totalLabel={kind === "hook" ? "with a clear hook" : "with a clear stage"}
      footnote={
        kind === "hook"
          ? unclearFootnote(unclearHooks(currentMix), clearHooks(currentMix), "hook")
          : unclearFootnote(unclearStages(currentMix), clearStages(currentMix), "stage")
      }
      formatLabel={(label) => (kind === "hook" ? hookName(label) : stageName(label))}
      loading={loading}
      items={
        kind === "hook"
          ? hookDistributionItems(currentMix, previousMix)
          : funnelDistributionItems(currentMix, previousMix)
      }
    />
  );
}
