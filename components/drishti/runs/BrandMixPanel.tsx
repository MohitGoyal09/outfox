"use client";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DistributionPanel } from "@/components/drishti";
import {
  countFindings,
  funnelDistributionItems,
  hookDistributionItems,
  mixForBrand,
  taggedClaims,
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
      summaryLabel={`${taggedClaims(current ?? []).length} tagged of ${countFindings(current ?? [])} claims`}
      previousLabel={previousLabel}
      loading={loading}
      items={
        kind === "hook"
          ? hookDistributionItems(currentMix, previousMix)
          : funnelDistributionItems(currentMix, previousMix)
      }
    />
  );
}
