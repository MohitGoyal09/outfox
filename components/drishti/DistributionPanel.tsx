"use client";


import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { Panel } from "./Panel";
import { Skeleton, SkeletonRegion } from "./Skeleton";
import {
  ABSENT,
  FUNNEL_STAGE_INDEX,
  LABEL_CLASS,
  TONE_COLOR,
  VALUE_CLASS,
  barWidthPct,
  deltaTone,
  formatDelta,
  formatSharePct,
  funnelDotColor,
  hookDotColor,
  iconProps,
  isFunnelStage,
  shareOf,
  type Tone,
} from "./tokens";

export type DistributionKind = "hook" | "funnel";
export type DistributionOrder = "rank" | "scale";

export type DistributionItem = {
  label: string;
  count: number | null;
  sharePct: number | null;
  delta: number | null;
  tone?: Tone;
  deltaUnit?: "count" | "pct";
  gap?: string;
};

export type DistributionRow = {
  label: string;
  count: number | null;
  sharePct: number | null;
  shareText: string;
  delta: number | null;
  deltaText: string;
  deltaTone: Tone;
  deltaColor: string;
  dotColor: string;
  barWidthPct: number;
  gap: string | null;
};

export type DistributionSegment = {
  label: string;
  sharePct: number;
  widthPct: number;
  color: string;
};

export function orderedDistributionRows(
  items: DistributionItem[],
  kind: DistributionKind,
  order?: DistributionOrder,
): DistributionItem[] {
  const resolved: DistributionOrder =
    order ?? (kind === "funnel" ? "scale" : "rank");
  const indexed = items.map((item, index) => ({ item, index }));
  indexed.sort((a, b) => {
    if (resolved === "scale") {
      const aIndex = isFunnelStage(a.item.label)
        ? FUNNEL_STAGE_INDEX[a.item.label]
        : Number.MAX_SAFE_INTEGER;
      const bIndex = isFunnelStage(b.item.label)
        ? FUNNEL_STAGE_INDEX[b.item.label]
        : Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
    } else {
      const aCount = a.item.count ?? -1;
      const bCount = b.item.count ?? -1;
      if (aCount !== bCount) return bCount - aCount;
    }
    return a.index - b.index;
  });
  return indexed.map((entry) => entry.item);
}

export function distributionTotal(items: DistributionItem[]): number {
  return items.reduce((sum, item) => {
    if (item.count === null || !Number.isFinite(item.count)) return sum;
    return sum + Math.max(0, item.count);
  }, 0);
}

export function deriveDistributionRows(
  items: DistributionItem[],
  kind: DistributionKind,
): DistributionRow[] {
  const total = distributionTotal(items);
  const maxCount = items.reduce((max, item) => {
    if (item.count === null || !Number.isFinite(item.count)) return max;
    return Math.max(max, item.count);
  }, 0);

  return items.map((item) => {
    const count =
      item.count !== null && Number.isFinite(item.count) ? item.count : null;
    const sharePct =
      item.sharePct !== null &&
      item.sharePct !== undefined &&
      Number.isFinite(item.sharePct)
        ? item.sharePct
        : shareOf(count, total);
    const delta =
      item.delta !== null && item.delta !== undefined && Number.isFinite(item.delta)
        ? item.delta
        : null;
    const unit = item.deltaUnit ?? "count";
    const tone = deltaTone(delta);
    const dotColor = item.tone
      ? TONE_COLOR[item.tone]
      : kind === "hook"
        ? hookDotColor(item.label)
        : funnelDotColor(item.label);
    return {
      label: item.label,
      count,
      sharePct,
      shareText: formatSharePct(sharePct),
      delta,
      deltaText: formatDelta(delta, unit),
      deltaTone: tone,
      deltaColor: TONE_COLOR[tone],
      dotColor,
      barWidthPct: barWidthPct(count, maxCount),
      gap: count === null ? (item.gap ?? ABSENT) : null,
    };
  });
}

export function stackedSegments(
  items: DistributionItem[],
  kind: DistributionKind,
): DistributionSegment[] {
  const total = distributionTotal(items);
  if (total <= 0) return [];

  const segments: DistributionSegment[] = [];
  for (const item of items) {
    if (
      item.count === null ||
      !Number.isFinite(item.count) ||
      item.count <= 0
    ) {
      continue;
    }
    const sharePct = (item.count / total) * 100;
    segments.push({
      label: item.label,
      sharePct,
      widthPct: sharePct,
      color:
        kind === "hook" ? hookDotColor(item.label) : funnelDotColor(item.label),
    });
  }
  if (segments.length === 0) return [];

  const sumWithoutLast = segments
    .slice(0, -1)
    .reduce((sum, segment) => sum + segment.widthPct, 0);
  const last = segments[segments.length - 1];
  last.widthPct = Math.max(0, Math.min(100, 100 - sumWithoutLast));

  return segments;
}

export type DistributionPanelProps = {
  items: DistributionItem[];
  kind: DistributionKind;
  title: string;
  order?: DistributionOrder;
  summaryLabel?: string;
  previousLabel?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
};

const COLUMN = "sm:text-right";

export function DistributionPanel({
  items,
  kind,
  title,
  order,
  summaryLabel,
  previousLabel,
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  className,
}: DistributionPanelProps) {
  const ordered = orderedDistributionRows(items, kind, order);
  const rows = deriveDistributionRows(ordered, kind);
  const segments = stackedSegments(ordered, kind);
  const defaultEmptyTitle =
    kind === "hook"
      ? "No hook mix in this run yet."
      : "No funnel mix in this run yet.";
  const defaultEmptyDescription =
    kind === "hook"
      ? "Every claim carries a hook type. The mix appears here once at least one engine returns claims."
      : "Every claim carries a funnel stage. The mix appears here once at least one engine returns claims.";

  return (
    <Panel interactive={false} className={cn("p-4", className)} ariaLabel={title}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
          {title}
        </h3>
        {summaryLabel ? (
          <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary,#64646f)]")}>
            {summaryLabel}
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px] leading-[1.5] text-[var(--danger,#f87171)]"
        >
          <span>{error}</span>
          {onRetry ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              icon={<RefreshCw {...iconProps} size={14} />}
            >
              Retry
            </Button>
          ) : null}
        </div>
      ) : loading ? (
        <SkeletonRegion label={`Loading ${title}`} className="mt-4">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton variant="circle" />
                <Skeleton
                  variant="text"
                  width={index % 2 === 0 ? "48%" : "36%"}
                />
                <span className="ml-auto flex items-center gap-3">
                  <Skeleton variant="text" width={20} />
                  <Skeleton variant="text" width={34} />
                  <Skeleton variant="text" width={38} />
                </span>
              </div>
            ))}
          </div>
        </SkeletonRegion>
      ) : rows.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            bounded
            title={emptyTitle ?? defaultEmptyTitle}
            description={emptyDescription ?? defaultEmptyDescription}
            action={emptyAction}
          />
        </div>
      ) : (
        <>
          <div className="mt-3 hidden items-center gap-x-3 border-b border-[var(--border,#24242f)] pb-1.5 sm:flex">
            <span className={cn(LABEL_CLASS, "min-w-0 flex-1 text-[var(--text-tertiary,#64646f)]")}>
              {kind === "hook" ? "hook type" : "funnel stage"}
            </span>
            <span className={cn(LABEL_CLASS, "w-10 text-[var(--text-tertiary,#64646f)]", COLUMN)}>
              count
            </span>
            <span className={cn(LABEL_CLASS, "w-12 text-[var(--text-tertiary,#64646f)]", COLUMN)}>
              share
            </span>
            <span className={cn(LABEL_CLASS, "w-20 text-[var(--text-secondary,#9797a3)]", COLUMN)}>
              {previousLabel ?? "change"}
            </span>
            <span aria-hidden="true" className="w-24" />
          </div>

          <ul className="flex flex-col">
            {rows.map((row) => (
              <li
                key={row.label}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2"
              >
                <span className="flex min-w-0 basis-full items-center gap-2 sm:basis-auto sm:flex-1">
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.dotColor }}
                  />
                  <span
                    className={cn(
                      LABEL_CLASS,
                      "break-words text-[var(--text-primary,#eeeef2)]",
                    )}
                  >
                    {row.label}
                  </span>
                </span>
                {row.gap ? (
                  <span className="basis-full text-[12px] leading-[1.45] text-[var(--text-tertiary,#64646f)] sm:basis-auto sm:flex-1">
                    {row.gap}
                  </span>
                ) : (
                  <>
                    <span
                      className={cn(
                        VALUE_CLASS,
                        "w-10 text-[12.5px] text-[var(--text-primary,#eeeef2)]",
                        COLUMN,
                      )}
                    >
                      {row.count}
                    </span>
                    <span
                      className={cn(
                        VALUE_CLASS,
                        "w-12 text-[11px] text-[var(--text-tertiary,#64646f)]",
                        COLUMN,
                      )}
                    >
                      {row.shareText}
                    </span>
                    <span
                      className={cn(VALUE_CLASS, "w-20 text-[12.5px]", COLUMN)}
                      style={{ color: row.deltaColor }}
                    >
                      {row.deltaText}
                    </span>
                    <span
                      aria-hidden="true"
                      className="hidden items-center sm:flex sm:w-24"
                    >
                      <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-inset,#0e0e13)]">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${row.barWidthPct}%`,
                            backgroundColor: row.dotColor,
                          }}
                        />
                      </span>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>

          {segments.length > 0 ? (
            <div
              aria-hidden="true"
              className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-inset,#0e0e13)]"
            >
              {segments.map((segment) => (
                <span
                  key={segment.label}
                  className="h-full"
                  style={{
                    width: `${segment.widthPct}%`,
                    backgroundColor: segment.color,
                  }}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}
