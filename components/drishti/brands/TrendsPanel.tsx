"use client";


import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { SkeletonRows } from "../Skeleton";
import { LABEL_CLASS, VALUE_CLASS, iconProps } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";
import type { ClaimDoc } from "./brand-model";
import { trendPoints } from "./brand-model";

export type TrendsPanelProps = {
  claims: ClaimDoc[];
  isLoading?: boolean;
  className?: string;
};

export function TrendsPanel({
  claims,
  isLoading = false,
  className,
}: TrendsPanelProps) {
  const points = trendPoints(claims);

  return (
    <Panel
      as="section"
      interactive={false}
      padded
      ariaLabel="Relative interest"
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
          Relative interest
        </h3>
        <p
          role="note"
          className="flex items-start gap-2 rounded-[5px] border border-dashed border-[var(--border,#24242f)] bg-[var(--bg-inset,#0e0e13)] p-3 text-[12.5px] leading-[1.5] text-[var(--text-secondary,#9797a3)]"
        >
          <CircleAlert
            {...iconProps}
            size={14}
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-[var(--text-tertiary,#64646f)]"
          />
          Within-chunk relative. Google Trends scores each brand against the
          others in the same chunk, so a value here is not comparable across
          chunks, brands, or runs.
        </p>
      </div>

      {isLoading ? (
        <SkeletonRows count={4} variant="row" height={40} />
      ) : points.length === 0 ? (
        <EmptyState
          size="sm"
          bounded
          title="No relative interest stored yet."
          description="Google Trends returns a relative score per chunk. It appears here after a run returns demand data for this brand."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border,#24242f)]">
          {points.map((point) => (
            <li
              key={point.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
            >
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className={cn(VALUE_CLASS, "text-[12.5px] text-[var(--text-primary,#eeeef2)]")}>
                  {point.value === null ? "not reported" : point.value}
                </span>
                <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
                  {point.chunk ?? "chunk not named"}
                </span>
                <span className="text-[12px] text-[var(--text-tertiary,#64646f)]">
                  {point.period ?? "period not reported"}
                </span>
              </span>
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className={cn(VALUE_CLASS, "text-[10.5px] text-[var(--text-tertiary,#64646f)]")}>
                  {formatStamp(point.fetchedAt)}
                </span>
                <a
                  href={point.evidenceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[12px] text-[var(--accent,#e2a339)] underline-offset-[3px] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)]"
                >
                  Google Trends
                </a>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
