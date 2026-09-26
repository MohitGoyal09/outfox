import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "../EmptyState";
import { hookName } from "../labels";
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
    <Panel interactive={false} className={cn("flex flex-col", className)} ariaLabel="Emerging moves">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h3 className="type-headline text-fg">Emerging moves</h3>
          <p className="mt-1 type-caption text-fg-secondary">{EMERGING_BASIS_LINE}</p>
        </div>
        {hasPrevious && previousLabel ? (
          <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>
            {previousLabel}
          </span>
        ) : null}
      </header>

      <div className="p-5">
        {loading ? (
          <SkeletonRows count={3} variant="row" height={40} />
        ) : !hasPrevious ? (
          <EmptyState
            size="sm"
            bounded
            icon={<TrendingUp {...iconProps} size={16} />}
            title="Emerging needs two checks for these brands."
            description="Change is measured against the previous check. After the next check lands, the hooks that gained or lost share appear here."
          />
        ) : !changed ? (
          <EmptyState
            size="sm"
            bounded
            icon={<TrendingUp {...iconProps} size={16} />}
            title="No hook share moved between the two most recent checks."
            description="A flat result is information: these brands held their creative mix. The next check will show any shift."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {moves.map((move) => (
              <li
                key={move.hook}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2"
              >
                <span className="min-w-0 flex-1">
                  <Badge variant="secondary" className="font-normal">{hookName(move.hook)}</Badge>
                </span>
                <span className={cn(VALUE_CLASS, "w-14 text-right text-[12.5px] text-fg")}>
                  {move.count}
                </span>
                <span className={cn(VALUE_CLASS, "w-14 text-right text-[11px] text-fg-tertiary")}>
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
      </div>
    </Panel>
  );
}