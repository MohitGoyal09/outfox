
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

export type StatTileProps = StatReadoutProps & {
  caption?: string;
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
        <Skeleton variant="stat" width={72} height={size === "md" ? 24 : 20} />
      </div>
    );
  }

  const valueNode = (
    <span
      className={cn(
        VALUE_CLASS,
        size === "md" ? "text-[1.25rem] leading-[1.2]" : "text-[15px] leading-[1.25]",
        measured.absent ? "text-fg-tertiary" : "text-fg",
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
        <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>{label}</span>
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
        <span className="w-full text-[12px] leading-[1.45] text-fg-secondary">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  tone,
  delta,
  deltaUnit = "count",
  size = "md",
  hint,
  caption,
  hideLabel = false,
  loading = false,
  title,
  className,
}: StatTileProps) {
  const measured = statReadoutText(value);
  const description = caption ?? hint;

  return (
    <div
      title={title}
      className={cn(
        "flex flex-col rounded-lg border border-border bg-bg-raised p-4 shadow-xs",
        className,
      )}
    >
      {hideLabel ? null : (
        <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>{label}</span>
      )}

      {loading ? (
        <Skeleton variant="stat" width={88} height={28} className="mt-2.5" />
      ) : (
        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span
            className={cn(
              VALUE_CLASS,
              size === "md"
                ? "text-[1.75rem] leading-none font-semibold"
                : "text-[1.25rem] leading-none font-semibold",
              measured.absent ? "text-fg-tertiary" : "text-fg",
            )}
            style={!measured.absent && tone ? { color: TONE_COLOR[tone] } : undefined}
          >
            {measured.text}
          </span>
          {unit && !measured.absent ? (
            <span className="text-[12px] leading-none text-fg-secondary">{unit}</span>
          ) : null}
          {delta === null || delta === undefined ? null : (
            <span
              className={cn(VALUE_CLASS, "ml-auto text-[12px] leading-none")}
              style={{ color: TONE_COLOR[deltaTone(delta)] }}
            >
              {formatDelta(delta, deltaUnit)}
            </span>
          )}
        </div>
      )}

      {description ? (
        <span className="mt-1.5 text-[12px] leading-[1.45] text-fg-secondary">
          {description}
        </span>
      ) : null}
    </div>
  );
}
