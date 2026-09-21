import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "../EmptyState";
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
    <Card className={cn("border-border/80 bg-card shadow-none", className)}>
      <CardHeader className="border-b border-border/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Emerging moves</CardTitle>
            <CardDescription className="mt-1">{EMERGING_BASIS_LINE}</CardDescription>
          </div>
        {hasPrevious && previousLabel ? (
          <span className={cn(VALUE_CLASS, "text-xs text-muted-foreground")}>
            {previousLabel}
          </span>
        ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">

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
        <ul className="flex flex-col divide-y divide-border/70">
          {moves.map((move) => (
            <li
              key={move.hook}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2"
            >
              <span className="min-w-0 flex-1">
                <Badge variant="secondary" className="font-normal">{move.hook}</Badge>
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
      </CardContent>
    </Card>
  );
}
