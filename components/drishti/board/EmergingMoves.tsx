import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { SkeletonRows } from "../Skeleton";
import { TONE_COLOR, VALUE_CLASS, iconProps } from "../tokens";
import {
  EMERGING_BASIS_LINE,
  emergingHasChange,
  type EmergingMove,
} from "./board-model";

export function EmergingMoves({
  moves,
  hasPrevious,
  previousLabel,
  loading = false,
  className,
}: {
  moves: EmergingMove[];
  hasPrevious: boolean;
  previousLabel?: string;
  loading?: boolean;
  className?: string;
}) {
  const changed = emergingHasChange(moves);

  return (
    <Panel
      as="section"
      interactive={false}
      className={cn("p-4", className)}
      ariaLabel="Emerging this week"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
          Emerging this week
        </h2>
        {hasPrevious && previousLabel ? (
          <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary,#64646f)]")}>
            {previousLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-1 max-w-[68ch] text-[12.5px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
        {EMERGING_BASIS_LINE}
      </p>

      {loading ? (
        <div className="mt-3">
          <SkeletonRows count={3} variant="row" height={40} />
        </div>
      ) : !hasPrevious ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            bounded
            icon={<TrendingUp {...iconProps} size={16} />}
            title="Emerging needs two runs for this cohort."
            description="Change is measured against the previous run. After the next run lands, the hooks that gained or lost share appear here."
          />
        </div>
      ) : !changed ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            bounded
            icon={<TrendingUp {...iconProps} size={16} />}
            title="No hook share moved between the two most recent runs."
            description="A flat result is information: the cohort held its creative mix. The next run will show any shift."
          />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col">
          {moves.map((move) => (
            <li
              key={move.hook}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2"
            >
              <span className="min-w-0 flex-1">
                <Chip
                  label={move.hook}
                  value={move.hook}
                  scale="hook"
                  title={`Hook share change for ${move.hook}`}
                />
              </span>
              <span
                className={cn(
                  VALUE_CLASS,
                  "w-14 text-right text-[12.5px] text-[var(--text-primary,#eeeef2)]",
                )}
              >
                {move.count}
              </span>
              <span
                className={cn(
                  VALUE_CLASS,
                  "w-14 text-right text-[11px] text-[var(--text-tertiary,#64646f)]",
                )}
              >
                {move.shareText}
              </span>
              <span
                className={cn(VALUE_CLASS, "w-16 text-right text-[12.5px]")}
                style={{ color: TONE_COLOR[move.tone] }}
              >
                {move.deltaText}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
