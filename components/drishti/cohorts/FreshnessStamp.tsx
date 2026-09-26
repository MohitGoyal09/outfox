"use client";


import { cn } from "@/lib/utils";
import { ABSENT, LABEL_CLASS, TONE_COLOR, VALUE_CLASS, type Tone } from "../tokens";
import { formatStamp, runStatusLabel } from "./cohorts-model";

export type FreshnessStampProps = {
  at: string | null | undefined;
  tone?: Tone;
  status?: string | null;
  caption?: string;
  className?: string;
};

export function FreshnessStamp({
  at,
  tone = "neutral",
  status = null,
  caption,
  className,
}: FreshnessStampProps) {
  const stamp = formatStamp(at);
  const absent = stamp === ABSENT;
  const label = caption ?? (status ? runStatusLabel(status) : "freshness");
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      title={at ?? undefined}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: TONE_COLOR[absent ? "neutral" : tone] }}
      />
      <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>
        {label}
      </span>
      <span
        className={cn(
          VALUE_CLASS,
          "text-[11.5px]",
          absent
            ? "text-[var(--text-tertiary)]"
            : "text-[var(--text-secondary)]",
        )}
      >
        {stamp}
      </span>
    </span>
  );
}
