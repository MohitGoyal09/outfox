"use client";

import { RefreshCw } from "lucide-react";

import {
  Button,
  EmptyState,
  LABEL_CLASS,
  Panel,
  Skeleton,
  SkeletonRegion,
  TONE_COLOR,
  VALUE_CLASS,
  deltaTone,
  formatDelta,
  formatSharePct,
  funnelDotColor,
  hookDotColor,
  iconProps,
} from "@/components/drishti";
import { categoricalColorFor } from "@/components/drishti/tokens";
import { cn } from "@/lib/utils";
import { FUNNEL_WORD, HOOK_WORD, formatCount } from "./labels";
import type { BrandMixSummary } from "./derive";
import type { BrandRef } from "./types";

export type ComparisonMatrixProps = {
  brands: readonly BrandRef[];
  summaries: readonly BrandMixSummary[];
  previousLabel: string | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
};

type RowKey = "claims" | "tags" | "hook" | "funnel";

const ROW_LABEL: Record<RowKey, string> = {
  claims: "claims",
  tags: "content tags",
  hook: "top hook",
  funnel: "top funnel stage",
};

type DeltaCell = { text: string; tone: ReturnType<typeof deltaTone> };

function deltaCell(summary: BrandMixSummary, row: RowKey): DeltaCell {
  if (row === "claims" || row === "tags") {
    const delta = row === "claims" ? summary.claimDelta : summary.tagDelta;
    if (delta === null) return { text: "not reported", tone: "neutral" };
    return { text: formatDelta(delta), tone: deltaTone(delta) };
  }
  if (row === "hook") {
    const change = summary.hookChange;
    if (change === null) return { text: "no hook change", tone: "neutral" };
    return {
      text: `${formatDelta(change.delta)} ${HOOK_WORD[change.hook] ?? change.hook}`,
      tone: deltaTone(change.delta),
    };
  }
  const change = summary.funnelChange;
  if (change === null) return { text: "no funnel change", tone: "neutral" };
  return {
    text: `${formatDelta(change.delta)} ${FUNNEL_WORD[change.stage] ?? change.stage}`,
    tone: deltaTone(change.delta),
  };
}

function ValueCell({ summary, row }: { summary: BrandMixSummary; row: RowKey }) {
  if (row === "claims") {
    return (
      <span className={cn(VALUE_CLASS, "text-[13px] text-[var(--text-primary)]")}>
        {formatCount(summary.claimCount)}
      </span>
    );
  }
  if (row === "tags") {
    return (
      <span className={cn(VALUE_CLASS, "text-[13px] text-[var(--text-primary)]")}>
        {formatCount(summary.tagCount)}
      </span>
    );
  }
  const leader =
    row === "hook"
      ? summary.hook === null
        ? null
        : {
            dot: hookDotColor(summary.hook.hook),
            word: HOOK_WORD[summary.hook.hook],
            count: summary.hook.count,
            share: formatSharePct(summary.hook.sharePct),
          }
      : summary.funnel === null
        ? null
        : {
            dot: funnelDotColor(summary.funnel.stage),
            word: FUNNEL_WORD[summary.funnel.stage],
            count: summary.funnel.count,
            share: formatSharePct(summary.funnel.sharePct),
          };
  if (leader === null) {
    return (
      <span className="text-[12.5px] leading-[1.45] text-[var(--text-tertiary)]">
        No tagged claims this run.
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: leader.dot }}
      />
      <span className={cn(VALUE_CLASS, "text-[12.5px] text-[var(--text-primary)]")}>
        {leader.word}
      </span>
      <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary)]")}>
        {formatCount(leader.count)} · {leader.share}
      </span>
    </span>
  );
}

const ROWS: RowKey[] = ["claims", "tags", "hook", "funnel"];

export function ComparisonMatrix({
  brands,
  summaries,
  previousLabel,
  loading = false,
  error = null,
  onRetry,
  className,
}: ComparisonMatrixProps) {
  if (loading) {
    return (
      <Panel interactive={false} className={cn("p-5", className)} ariaLabel="Side by side">
        <SkeletonRegion label="Loading the comparison">
          <Skeleton variant="text" width={132} height={13} />
          <div className="mt-4 flex flex-col gap-3">
            {ROWS.map((row) => (
              <div key={row} className="flex items-center gap-4">
                <Skeleton variant="text" width={88} />
                {brands.map((brand) => (
                  <Skeleton key={brand.id} variant="text" width="32%" />
                ))}
                {previousLabel === null ? null : <Skeleton variant="text" width="18%" />}
              </div>
            ))}
          </div>
        </SkeletonRegion>
      </Panel>
    );
  }

  if (error !== null) {
    return (
      <Panel interactive={false} className={cn("p-4", className)} ariaLabel="Side by side">
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 text-[12.5px] leading-[1.5] text-[var(--danger)]"
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
      </Panel>
    );
  }

  const totalClaims = summaries.reduce((sum, summary) => sum + summary.claimCount, 0);

  return (
    <Panel interactive={false} className={cn("overflow-hidden", className)} ariaLabel="Side by side">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Coverage and counts
        </h3>
      </div>
      <div className="p-5">

      {brands.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            bounded
            title="No rivals in this cohort."
            description="A run compares named rivals. This run stored no brands, so there is nothing to place side by side."
          />
        </div>
      ) : totalClaims === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            bounded
            title="No claims in this run yet."
            description="Claims are stored as each engine returns. This run stored none, so there is no mix to compare."
          />
        </div>
      ) : (
        <>
          {brands.length === 1 ? (
            <p className="mt-2 text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">
              One rival in this run, a comparison needs at least two.
            </p>
          ) : null}

          <div className="mt-3 hidden min-[900px]:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Rival mix and counts{previousLabel === null ? "" : `, with the change against the run of ${previousLabel}`}
              </caption>
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th scope="col" className={cn(LABEL_CLASS, "pb-2 text-[var(--text-tertiary)]")}>
                    dimension
                  </th>
                  {brands.map((brand) => (
                    <th
                      key={brand.id}
                      scope="col"
                      className="pb-2 pl-4 text-[12.5px] font-medium text-[var(--text-primary)]"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: categoricalColorFor(brand.name) }}
                        />
                        {brand.name}
                      </span>
                    </th>
                  ))}
                  {previousLabel === null ? null : (
                    <th
                      scope="col"
                      className={cn(LABEL_CLASS, "pb-2 pl-4 text-[var(--text-secondary)]")}
                    >
                      Δ vs run of {previousLabel}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row} className="border-b border-[var(--border)] last:border-b-0">
                    <th
                      scope="row"
                      className={cn(
                        LABEL_CLASS,
                        "py-3 pr-4 align-top font-semibold text-[var(--text-secondary)]",
                      )}
                    >
                      {ROW_LABEL[row]}
                    </th>
                    {summaries.map((summary) => (
                      <td key={summary.brandId} className="py-3 pl-4 align-top">
                        <ValueCell summary={summary} row={row} />
                      </td>
                    ))}
                    {previousLabel === null ? null : (
                      <td className="py-3 pl-4 align-top">
                        <ul className="flex flex-col gap-1">
                          {summaries.map((summary) => {
                            const cell = deltaCell(summary, row);
                            return (
                              <li
                                key={summary.brandId}
                                className="flex flex-wrap items-baseline gap-x-2"
                              >
                                <span className="text-[12px] leading-[1.3] text-[var(--text-tertiary)]">
                                  {summary.brandName}
                                </span>
                                <span
                                  className={cn(VALUE_CLASS, "text-[12px] leading-[1.3]")}
                                  style={{ color: TONE_COLOR[cell.tone] }}
                                >
                                  {cell.text}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-3 flex flex-col gap-3 min-[900px]:hidden">
            {summaries.map((summary) => (
              <li
                key={summary.brandId}
                className="border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0"
              >
                <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-primary)]">
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: categoricalColorFor(summary.brandName) }}
                  />
                  {summary.brandName}
                </p>
                {previousLabel === null ? null : (
                  <p className={cn(LABEL_CLASS, "mt-1 text-[var(--text-tertiary)]")}>
                    Δ vs run of {previousLabel}
                  </p>
                )}
                <dl className="mt-2 flex flex-col gap-2">
                  {ROWS.map((row) => {
                    const cell = deltaCell(summary, row);
                    return (                      <div
                        key={row}
                        className="flex flex-col gap-1 min-[480px]:flex-row min-[480px]:items-baseline min-[480px]:gap-x-3"
                      >
                        <dt
                          className={cn(
                            LABEL_CLASS,
                            "text-[var(--text-tertiary)] min-[480px]:w-[6.5rem] min-[480px]:shrink-0",
                          )}
                        >
                          {ROW_LABEL[row]}
                        </dt>
                        <dd className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <ValueCell summary={summary} row={row} />
                          {previousLabel === null ? null : (
                            <span
                              className={cn(VALUE_CLASS, "text-[12px]")}
                              style={{ color: TONE_COLOR[cell.tone] }}
                            >
                              {cell.text}
                            </span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
      </div>
    </Panel>
  );
}
