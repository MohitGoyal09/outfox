"use client";


import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { DeltaMark } from "./DeltaMark";
import { EmptyState } from "./EmptyState";
import { MetricInfo } from "./MetricInfo";
import { Panel } from "./Panel";
import { Skeleton, SkeletonRegion } from "./Skeleton";
import {
  ABSENT,
  FUNNEL_COLOR,
  FUNNEL_STAGE_INDEX,
  HOOK_COLOR,
  TONE_COLOR,
  VALUE_CLASS,
  barWidthPct,
  categoricalColorFor,
  deltaTone,
  formatDelta,
  formatSharePct,
  iconProps,
  isFunnelStage,
  isHookType,
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
  deltaUnit?: "count" | "pct" | "pp";
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
  deltaGlyph: "up" | "down" | null;
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

function distributionColor(label: string, kind: DistributionKind): string {
  if (kind === "hook") {
    return isHookType(label) ? HOOK_COLOR[label] : categoricalColorFor(label);
  }
  return isFunnelStage(label) ? FUNNEL_COLOR[label] : categoricalColorFor(label);
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
    const tone = unit === "pp" ? "neutral" : deltaTone(delta);
    const dotColor = item.tone
      ? TONE_COLOR[item.tone]
      : distributionColor(item.label, kind);
    return {
      label: item.label,
      count,
      sharePct,
      shareText: formatSharePct(sharePct),
      delta,
      deltaText: formatDelta(delta, unit),
      deltaTone: tone,
      deltaGlyph:
        unit === "pp" && delta !== null && Math.abs(delta) >= 0.05 ? (delta > 0 ? "up" : "down") : null,
      deltaColor: unit === "pp" ? "var(--text-secondary)" : TONE_COLOR[tone],
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
      color: distributionColor(item.label, kind),
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
  previousInfo?: string;
  totalLabel?: string;
  footnote?: ReactNode;
  formatLabel?: (label: string, kind: DistributionKind) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
};

const COLUMN = "sm:text-right";
const HEADER_CLASS = "whitespace-nowrap text-[12px] font-medium";

export function DistributionPanel({
  items,
  kind,
  title,
  order,
  summaryLabel,
  previousLabel,
  previousInfo,
  totalLabel = "total",
  footnote,
  formatLabel,
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
  const total = distributionTotal(ordered);
  const defaultEmptyTitle =
    kind === "hook"
      ? "No hook mix in this run yet."
      : "No funnel mix in this run yet.";
  const defaultEmptyDescription =
    kind === "hook"
      ? "Every tagged finding carries a hook type. The mix appears here once at least one finding has been tagged."
      : "Every tagged finding carries a funnel stage. The mix appears here once at least one finding has been tagged.";

  return (
    <Panel interactive={false} className={cn("p-4", className)} ariaLabel={title}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="type-headline text-fg">
          {title}
        </h3>
        {summaryLabel ? (
          <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary)]")}>
            {summaryLabel}
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-3 flex flex-wrap items-center gap-3 text-[12.5px] leading-[1.5] text-[var(--danger)]"
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
          <div className="mt-3 hidden items-center gap-x-3 border-b border-[var(--border)] pb-1.5 sm:flex">
            <span className={cn(HEADER_CLASS, "min-w-0 flex-1 text-[var(--text-tertiary)]")}>
              {kind === "hook" ? "Hook type" : "Funnel stage"}
            </span>
            <span className={cn(HEADER_CLASS, "w-12 text-[var(--text-tertiary)]", COLUMN)}>
              Count
            </span>
            <span className={cn(HEADER_CLASS, "w-14 text-[var(--text-tertiary)]", COLUMN)}>
              Share
            </span>
            <span
              className={cn(
                HEADER_CLASS,
                "w-28 text-[var(--text-secondary)]",
                COLUMN,
              )}
            >
              {previousInfo ? (
                <MetricInfo label={previousLabel ?? "Change"} definition={previousInfo} />
              ) : (
                (previousLabel ?? "Change")
              )}
            </span>
            <span aria-hidden="true" className="w-24" />
          </div>

          <ul className="flex flex-col">
            {rows.map((row) => (
              <li
                key={row.label}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2 sm:flex-nowrap"
              >
                <span className="flex min-w-0 basis-full items-center gap-2 sm:basis-auto sm:flex-1">
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.dotColor }}
                  />
                  <span
                    className={cn(
                      "break-words text-[13px] leading-[1.4] text-[var(--text-primary)]",
                    )}
                  >
                    {formatLabel ? formatLabel(row.label, kind) : row.label}
                  </span>
                </span>
                {row.gap ? (
                  <span className="basis-full text-[12px] leading-[1.45] text-[var(--text-tertiary)] sm:basis-auto sm:flex-1">
                    {row.gap}
                  </span>
                ) : (
                  <>
                    <span
                      className={cn(
                        VALUE_CLASS,
                        "w-12 shrink-0 text-[12.5px] text-[var(--text-primary)]",
                        COLUMN,
                      )}
                    >
                      {row.count}
                    </span>
                    <span
                      className={cn(
                        VALUE_CLASS,
                        "w-14 shrink-0 text-[11px] text-[var(--text-tertiary)]",
                        COLUMN,
                      )}
                    >
                      {row.shareText}
                    </span>
                    <span
                      className={cn(VALUE_CLASS, "w-28 shrink-0 text-[12.5px]", COLUMN)}
                      style={{ color: row.deltaColor }}
                    >
                      {row.deltaGlyph ? (
                        <DeltaMark direction={row.deltaGlyph} />
                      ) : null}
                      {row.deltaText}
                    </span>
                    <span
                      aria-hidden="true"
                      className="hidden items-center sm:flex sm:w-24 sm:shrink-0"
                    >
                      <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-inset)]">
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
            <div className="mt-3 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--bg-inset)]"
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
              </span>
              <span
                className={cn(
                  VALUE_CLASS,
                  "shrink-0 text-[10.5px] text-[var(--text-tertiary)]",
                )}
              >
                {total} {totalLabel}
              </span>
            </div>
          ) : null}
          {footnote ? (
            <p className="mt-3 text-[12px] leading-[1.5] text-[var(--text-secondary)]">{footnote}</p>
          ) : null}
        </>
      )}
    </Panel>
  );
}
