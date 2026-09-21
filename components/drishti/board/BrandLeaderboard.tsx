import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { SkeletonRows } from "../Skeleton";
import { LABEL_CLASS, VALUE_CLASS, iconProps } from "../tokens";
import { LEADERBOARD_RULE_LINE, type BrandLeader } from "./board-model";

export function BrandLeaderboard({
  rows,
  totalClaims,
  loading = false,
  className,
}: {
  rows: BrandLeader[];
  totalClaims: number;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Panel
      as="section"
      interactive={false}
      className={cn("p-4", className)}
      ariaLabel="Brand leaderboard"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
          Brand leaderboard
        </h2>
        {loading ? null : (
          <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary,#64646f)]")}>
            {rows.length} brands · {totalClaims} claims
          </span>
        )}
      </div>
      <p className="mt-1 max-w-[68ch] text-[12.5px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
        {LEADERBOARD_RULE_LINE}
      </p>

      {loading ? (
        <div className="mt-3">
          <SkeletonRows count={4} variant="row" height={40} />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            bounded
            icon={<Users {...iconProps} size={16} />}
            title="No brand has claims in this run yet."
            description="A brand appears here once at least one engine returns a claim for it. Ranking is by claim volume, then engine breadth."
          />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col">
          <li className="hidden items-center gap-x-3 border-b border-[var(--border,#24242f)] pb-1.5 sm:flex">
            <span className={cn(LABEL_CLASS, "w-6 text-[var(--text-tertiary,#64646f)]")}>
              rank
            </span>
            <span className={cn(LABEL_CLASS, "min-w-0 flex-1 text-[var(--text-tertiary,#64646f)]")}>
              brand
            </span>
            <span className={cn(LABEL_CLASS, "w-16 text-right text-[var(--text-tertiary,#64646f)]")}>
              claims
            </span>
            <span className={cn(LABEL_CLASS, "w-20 text-right text-[var(--text-tertiary,#64646f)]")}>
              engines
            </span>
            <span className={cn(LABEL_CLASS, "w-40 text-right text-[var(--text-tertiary,#64646f)]")}>
              top hook
            </span>
          </li>
          {rows.map((row) => (
            <li
              key={row.brandId}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2"
            >
              <span
                className={cn(
                  VALUE_CLASS,
                  "w-6 text-[12.5px] text-[var(--text-tertiary,#64646f)]",
                )}
              >
                {row.rank}
              </span>
              <span className="min-w-0 flex-1 break-words text-[13.5px] leading-[1.4] text-[var(--text-primary,#eeeef2)]">
                {row.brandName}
              </span>
              <span
                className={cn(
                  VALUE_CLASS,
                  "w-16 text-right text-[12.5px] text-[var(--text-primary,#eeeef2)]",
                )}
              >
                {row.claimCount}
              </span>
              <span
                className={cn(
                  VALUE_CLASS,
                  "w-20 text-right text-[12.5px] text-[var(--text-secondary,#9797a3)]",
                )}
              >
                {row.engineCount}
              </span>
              <span className="w-full text-right sm:w-40">
                {row.topHook === null ? (
                  <span className="text-[12.5px] leading-[1.45] text-[var(--text-tertiary,#64646f)]">
                    no hook tagged
                  </span>
                ) : (
                  <Chip
                    label={`${row.topHook} ${row.topHookCount}`}
                    value={row.topHook}
                    scale="hook"
                    title={`Most common hook for ${row.brandName}`}
                  />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
