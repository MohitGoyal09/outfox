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
  iconProps,
} from "@/components/drishti";
import { cn } from "@/lib/utils";
import { ENGINE_STATUS_WORD, engineCellTone } from "./labels";
import type { BrandRef, EngineCell, EngineRow } from "./types";

export type EngineCoverageProps = {
  rows: readonly EngineRow[];
  brands: readonly BrandRef[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
};

function StatusCell({ cell }: { cell: EngineCell }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: TONE_COLOR[engineCellTone(cell.status)] }}
        />
        <span
          className={cn(
            VALUE_CLASS,
            "text-[12px] leading-[1.3]",
            cell.status === "ok"
              ? "text-[var(--text-primary,#eeeef2)]"
              : "text-[var(--text-secondary,#9797a3)]",
          )}
        >
          {ENGINE_STATUS_WORD[cell.status]}
        </span>
      </span>
      {cell.status !== "ok" && cell.reason !== null ? (
        <span className="max-w-[46ch] text-[12px] leading-[1.45] text-[var(--text-tertiary,#64646f)]">
          {cell.reason}
        </span>
      ) : null}
    </span>
  );
}

export function EngineCoverage({
  rows,
  brands,
  loading = false,
  error = null,
  onRetry,
  className,
}: EngineCoverageProps) {
  if (loading) {
    return (
      <Panel interactive={false} className={cn("p-4", className)} ariaLabel="Engine coverage">
        <SkeletonRegion label="Loading engine coverage">
          <Skeleton variant="text" width={124} height={13} />
          <div className="mt-4 flex flex-col gap-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton variant="text" width={112} />
                {brands.map((brand) => (
                  <Skeleton key={brand.id} variant="text" width="28%" />
                ))}
              </div>
            ))}
          </div>
        </SkeletonRegion>
      </Panel>
    );
  }

  if (error !== null) {
    return (
      <Panel interactive={false} className={cn("p-4", className)} ariaLabel="Engine coverage">
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 text-[12.5px] leading-[1.5] text-[var(--danger,#f87171)]"
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

  return (
    <Panel interactive={false} className={cn("p-4", className)} ariaLabel="Engine coverage">
      <h3 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
        Engine coverage
      </h3>

      {rows.length === 0 || brands.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            bounded
            title="No engines ran in this run."
            description="Coverage appears once a run stores a snapshot for each engine it calls. This run stored none, so there is no coverage to show."
          />
        </div>
      ) : (
        <>
          <div className="mt-3 hidden min-[900px]:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Engine status per rival. An engine that failed and an engine that was unavailable are named separately.
              </caption>
              <thead>
                <tr className="border-b border-[var(--border,#24242f)]">
                  <th scope="col" className={cn(LABEL_CLASS, "pb-2 text-[var(--text-tertiary,#64646f)]")}>
                    engine
                  </th>
                  {brands.map((brand) => (
                    <th
                      key={brand.id}
                      scope="col"
                      className="pb-2 pl-4 text-[12.5px] font-medium text-[var(--text-primary,#eeeef2)]"
                    >
                      {brand.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.engine} className="border-b border-[var(--border,#24242f)] last:border-b-0">
                    <th
                      scope="row"
                      className="py-3 pr-4 align-top text-[12.5px] font-medium text-[var(--text-primary,#eeeef2)]"
                    >
                      {row.label}
                      <span
                        className={cn(
                          VALUE_CLASS,
                          "mt-1 block text-[11px] text-[var(--text-tertiary,#64646f)]",
                        )}
                      >
                        {row.okCount} of {row.cells.length} returned
                      </span>
                    </th>
                    {row.cells.map((cell) => (
                      <td key={cell.brandId} className="py-3 pl-4 align-top">
                        <StatusCell cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-3 flex flex-col gap-3 min-[900px]:hidden">
            {rows.map((row) => (
              <li
                key={row.engine}
                className="border-t border-[var(--border,#24242f)] pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
                    {row.label}
                  </p>
                  <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary,#64646f)]")}>
                    {row.okCount} of {row.cells.length} returned
                  </span>
                </div>
                <ul className="mt-2 flex flex-col gap-2">
                  {row.cells.map((cell) => (
                    <li key={cell.brandId} className="flex flex-col gap-1">
                      <span className="text-[12px] leading-[1.3] text-[var(--text-tertiary,#64646f)]">
                        {cell.brandName}
                      </span>
                      <StatusCell cell={cell} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
