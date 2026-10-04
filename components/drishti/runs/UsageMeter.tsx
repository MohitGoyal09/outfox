"use client";

import { Fragment, type ReactNode } from "react";

import { Skeleton, SkeletonRegion, TONE_COLOR, VALUE_CLASS, type Tone } from "@/components/drishti";
import { cn } from "@/lib/utils";
import {
  COST_PROVENANCE_LABEL,
  COST_PROVENANCE_NOTE,
  READOUT_SEPARATOR,
  billedSearchesLabel,
  costProvenance,
  formatCount,
  formatUsd,
} from "./labels";

export type UsageMeterProps = {
  requestCount: number | null | undefined;
  llmRequestCount: number | null | undefined;
  llmTokenCount: number | null | undefined;
  creditsUsed: number | null | undefined;
  creditsReported: boolean | null | undefined;
  exactCostUsd: number | null | undefined;
  estimatedCostUsd: number | null | undefined;
  loading?: boolean;
  trailing?: ReactNode;
  className?: string;
};

type Segment = {
  key: string;
  text: string;
  tone?: Tone;
  title?: string;
};

export function UsageMeter({
  requestCount,
  llmRequestCount,
  llmTokenCount,
  creditsUsed,
  creditsReported,
  exactCostUsd,
  estimatedCostUsd,
  loading = false,
  trailing,
  className,
}: UsageMeterProps) {
  if (loading) {
    return (
      <SkeletonRegion label="Loading run usage" className={className}>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton variant="stat" width={86} height={14} />
          <Skeleton variant="stat" width={96} height={14} />
          <Skeleton variant="stat" width={72} height={14} />
        </div>
      </SkeletonRegion>
    );
  }

  const segments: Segment[] = [];

  segments.push({
    key: "searches",
    text:
      requestCount === null || requestCount === undefined
        ? "searches not reported"
        : `${formatCount(requestCount)} ${requestCount === 1 ? "search" : "searches"}`,
  });

  segments.push({
    key: "calls",
    text:
      llmRequestCount === null || llmRequestCount === undefined
        ? "model calls not reported"
        : `${formatCount(llmRequestCount)} ${llmRequestCount === 1 ? "model call" : "model calls"}`,
  });

  if (llmTokenCount !== null && llmTokenCount !== undefined) {
    segments.push({
      key: "tokens",
      text: `${formatCount(llmTokenCount)} tokens`,
    });
  }

  const provenance = costProvenance(exactCostUsd, estimatedCostUsd);
  if (provenance === "unknown") {
    segments.push({
      key: "cost",
      text: "cost not reported",
      title: COST_PROVENANCE_NOTE.unknown,
    });
  } else {
    const total =
      (exactCostUsd !== null && exactCostUsd !== undefined ? exactCostUsd : 0) +
      (estimatedCostUsd !== null && estimatedCostUsd !== undefined
        ? estimatedCostUsd
        : 0);
    segments.push({
      key: "cost",
      text: `${formatUsd(total)} ${COST_PROVENANCE_LABEL[provenance]}`,
      tone: provenance === "exact" ? "ok" : "warn",
      title: COST_PROVENANCE_NOTE[provenance],
    });
  }

  if (creditsReported !== null && creditsReported !== undefined) {
    const billed = billedSearchesLabel(creditsUsed, creditsReported);
    segments.push({ key: "credits", ...billed });
  }

  const nodes: ReactNode[] = segments.map((segment) => (
    <span
      key={segment.key}
      title={segment.title}
      className={cn(
        VALUE_CLASS,
        "text-[12px] leading-[1.4] text-[var(--text-secondary)]",
      )}
      style={segment.tone ? { color: TONE_COLOR[segment.tone] } : undefined}
    >
      {segment.text}
    </span>
  ));
  if (trailing !== undefined && trailing !== null) nodes.push(trailing);

  return (
    <div
      aria-label="Run usage and engine coverage"
      className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1", className)}
    >
      {nodes.map((node, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span aria-hidden="true" className="text-[var(--text-tertiary)]">
              {READOUT_SEPARATOR}
            </span>
          ) : null}
          {node}
        </Fragment>
      ))}
    </div>
  );
}
