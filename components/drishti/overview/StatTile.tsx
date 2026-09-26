"use client";

import type { ReactNode } from "react";

import { Panel, StatReadout, TONE_COLOR, type Tone } from "@/components/drishti";
import { cn } from "@/lib/utils";

export type StatTileProps = {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  tone?: Tone;
  accent?: Tone;
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function StatTile({
  label,
  value,
  unit,
  tone,
  accent,
  hint,
  icon,
  loading = false,
  className,
}: StatTileProps) {
  const accentColor =
    accent !== undefined && accent !== "neutral" ? TONE_COLOR[accent] : null;
  return (
    <Panel
      as="div"
      interactive={false}
      className={cn(
        "h-full rounded-lg p-5 shadow-xs motion-safe:transition-shadow hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <StatReadout label={label} value={value} unit={unit} tone={tone} size="md" loading={loading} />
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-[8px] border bg-bg-inset",
              accentColor === null && "border-border text-fg-secondary",
            )}
            style={
              accentColor === null
                ? undefined
                : {
                    color: accentColor,
                    borderColor: `color-mix(in srgb, ${accentColor} 32%, var(--border))`,
                    backgroundColor: `color-mix(in srgb, ${accentColor} 10%, var(--bg-inset))`,
                  }
            }
          >
            {icon}
          </span>
        ) : null}
      </div>
      {hint && !loading ? (
        <p className="mt-2.5 type-caption text-fg-secondary">{hint}</p>
      ) : null}
    </Panel>
  );
}
