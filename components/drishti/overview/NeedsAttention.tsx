"use client";

import { TriangleAlert } from "lucide-react";

import { Chip, LABEL_CLASS, iconProps, type Tone } from "@/components/drishti";
import { cn } from "@/lib/utils";

import { ActionLink } from "./ActionLink";
import { Card } from "./Card";
import { pluralize, type AttentionReason, type AttentionRow } from "./overview-model";

const REASON_TONE: Record<AttentionReason, Tone> = {
  never_run: "neutral",
  failed: "danger",
  stale: "warn",
};

const REASON_LABEL: Record<AttentionReason, string> = {
  never_run: "not checked",
  failed: "check failed",
  stale: "stale",
};

export type NeedsAttentionProps = {
  rows: readonly AttentionRow[];
};

export function NeedsAttention({ rows }: NeedsAttentionProps) {
  if (rows.length === 0) return null;

  return (
    <Card
      title="Needs attention"
      description={`${rows.length} ${pluralize(rows.length, "brand")} need a look.`}
      icon={<TriangleAlert {...iconProps} size={16} aria-hidden="true" className="size-4" />}
      className="h-full border-[color-mix(in_srgb,var(--warn)_30%,var(--border))]"
    >
      <ul className="flex flex-col divide-y divide-border">
        {rows.map((row) => (
          <li
            key={row.brandId}
            className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(LABEL_CLASS, "text-fg")}>{row.brandName}</span>
                {row.isOwnBrand ? <Chip label="Your brand" dot={false} /> : null}
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
    </Card>
  );
}
