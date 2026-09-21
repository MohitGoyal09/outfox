
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";
import {
  ABSENT,
  LABEL_CLASS,
  TONE_COLOR,
  VALUE_CLASS,
  deltaTone,
  formatDelta,
  type Tone,
} from "./tokens";

export type StatReadoutProps = {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  tone?: Tone;
  delta?: number | null;
  deltaUnit?: "count" | "pct";
  layout?: "stacked" | "inline";
  size?: "sm" | "md";
  hint?: string;
  hideLabel?: boolean;
  loading?: boolean;
  title?: string;
  className?: string;
};

export type StatReadoutText = { text: string; absent: boolean };

export function statReadoutText(
  value: string | number | null | undefined,
  unit?: string,
): StatReadoutText {
  if (value === null || value === undefined) {
    return { text: ABSENT, absent: true };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { text: ABSENT, absent: true };
    return { text: unit ? `${value} ${unit}` : String(value), absent: false };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return { text: ABSENT, absent: true };
  return { text: unit ? `${trimmed} ${unit}` : trimmed, absent: false };
}

export function StatReadout({
  label,
  value,
  unit,
  tone,
  delta,
  deltaUnit = "count",
  layout = "stacked",
  size = "sm",
  hint,
  hideLabel = false,
  loading = false,
  title,
  className,
}: StatReadoutProps) {
  const measured = statReadoutText(value, unit);
  const inline = layout === "inline";

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {hideLabel ? null : <Skeleton variant="text" width={56} height={10} />}
        <Skeleton variant="stat" width={72} height={size === "md" ? 22 : 18} />
      </div>
    );
  }

  const valueNode = (
    <span
      className={cn(
        VALUE_CLASS,
        size === "md" ? "text-[1.05rem] leading-[1.2]" : "text-[13px] leading-[1.3]",
        measured.absent
          ? "text-[var(--text-tertiary,#64646f)]"
          : "text-[var(--text-primary,#eeeef2)]",
      )}
      style={!measured.absent && tone ? { color: TONE_COLOR[tone] } : undefined}
    >
      {measured.text}
    </span>
  );

  return (
    <div
      title={title}
      className={cn(
        inline ? "flex flex-wrap items-baseline gap-x-2 gap-y-0.5" : "flex flex-col gap-1",
        className,
      )}
    >
      {hideLabel ? null : (
        <span
          className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}
        >
          {label}
        </span>
      )}
      {valueNode}
      {delta === null || delta === undefined ? null : (
        <span
          className={cn(VALUE_CLASS, "text-[11px] leading-[1.2]")}
          style={{ color: TONE_COLOR[deltaTone(delta)] }}
        >
          {formatDelta(delta, deltaUnit)}
        </span>
      )}
      {hint ? (
        <span className="w-full text-[12px] leading-[1.45] text-[var(--text-secondary,#9797a3)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
