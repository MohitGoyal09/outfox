"use client";

import { TriangleAlert } from "lucide-react";

import { Chip, LABEL_CLASS, iconProps, type Tone } from "@/components/drishti";
import { cn } from "@/lib/utils";

import { ActionLink } from "./ActionLink";
import { SectionLabel } from "./SectionLabel";
import type { AttentionReason, AttentionRow } from "./overview-model";

const REASON_TONE: Record<AttentionReason, Tone> = {
  never_run: "neutral",
  failed: "danger",
  stale: "warn",
};

const REASON_LABEL: Record<AttentionReason, string> = {
  never_run: "never run",
  failed: "run failed",
  stale: "stale",
};

export type NeedsAttentionProps = {
  rows: readonly AttentionRow[];
};

export function NeedsAttention({ rows }: NeedsAttentionProps) {
  if (rows.length === 0) return null;

  return (
    <section aria-label="Needs attention" className="flex flex-col gap-3">
      <SectionLabel
        trailing={
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-fg-tertiary">
            <TriangleAlert {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            {rows.length}
          </span>
        }
      >
        Needs attention
      </SectionLabel>
      <ul className="flex flex-col divide-y divide-border rounded-md border border-[var(--warn,#b45309)]/25 bg-[var(--bg-inset,#f1f3f0)]">
        {rows.map((row) => (
          <li
            key={row.brandId}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(LABEL_CLASS, "text-fg")}>{row.brandName}</span>
                <Chip label={REASON_LABEL[row.reason]} tone={REASON_TONE[row.reason]} />
              </div>
              <p className="type-body max-w-[64ch] text-fg-secondary">{row.detail}</p>
            </div>
            <div className="shrink-0">
              <ActionLink href={row.actionHref} size="sm">
                {row.actionLabel}
              </ActionLink>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
