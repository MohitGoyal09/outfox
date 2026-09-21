"use client";


import { cn } from "@/lib/utils";
import { DistributionPanel } from "../DistributionPanel";
import {
  funnelDistribution,
  hookDistribution,
  tagBearingClaims,
  type ClaimDoc,
} from "./brand-model";
import { formatStamp } from "../cohorts/cohorts-model";

export type MixPanelProps = {
  kind: "hook" | "funnel";
  claims: ClaimDoc[];
  previousClaims: ClaimDoc[];
  previousRunAt: string | null;
  isLoading?: boolean;
  className?: string;
};

export function MixPanel({
  kind,
  claims,
  previousClaims,
  previousRunAt,
  isLoading = false,
  className,
}: MixPanelProps) {
  const items =
    kind === "hook"
      ? hookDistribution(claims, previousClaims)
      : funnelDistribution(claims, previousClaims);
  const tagged = tagBearingClaims(claims).length;
  const summary = `${tagged} ${tagged === 1 ? "tag" : "tags"}`;
  const previousLabel =
    previousRunAt === null
      ? "change"
      : `vs ${formatStamp(previousRunAt)}`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <DistributionPanel
        items={items}
        kind={kind}
        title={kind === "hook" ? "Hook mix" : "Funnel mix"}
        summaryLabel={summary}
        previousLabel={previousLabel}
        loading={isLoading}
      />
      <p className="text-[12px] leading-[1.45] text-[var(--text-tertiary,#64646f)]">
        {previousRunAt === null
          ? "No earlier run exists for this brand, so the change column is blank rather than zero."
          : `Change is counted against the run of ${formatStamp(previousRunAt)}. A delta of zero is information, not a missing value.`}
      </p>
    </div>
  );
}
