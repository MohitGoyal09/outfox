"use client";


import { cn } from "@/lib/utils";
import { LABEL_CLASS, STATE_TRANSITION_CLASS, TONE_COLOR, VALUE_CLASS, formatLatency } from "../tokens";
import type { ToolCallCardView } from "./ask-model";

const STATUS_LABEL: Record<ToolCallCardView["status"], string> = {
  pending: "pending",
  running: "running…",
  complete: "complete",
  failed: "failed",
  skipped: "skipped",
};

export function ToolCallCard({ card }: { card: ToolCallCardView }) {
  const duration = formatLatency(card.durationMs);
  const rawDetail =
    card.rawPayload !== null &&
    card.rawPayload !== undefined &&
    Object.keys(card.rawPayload as Record<string, unknown>).length > 0
      ? JSON.stringify(card.rawPayload, null, 2)
      : null;

  return (
    <li className="flex flex-col gap-1 rounded-[6px] border border-border bg-bg-raised px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", STATE_TRANSITION_CLASS)}
          style={{ backgroundColor: TONE_COLOR[card.tone] }}
        />
        <span className={cn(LABEL_CLASS, "text-fg-secondary")}>{card.name}</span>
        <span className={cn(VALUE_CLASS, "text-[10.5px] text-fg-tertiary")}>
          {STATUS_LABEL[card.status]}
        </span>
        {duration !== null ? (
          <span className={cn(VALUE_CLASS, "text-[10.5px] text-fg-tertiary")}>{duration}</span>
        ) : null}
        {card.resultCount !== null ? (
          <span className={cn(VALUE_CLASS, "text-[10.5px] text-fg-tertiary")}>
            {card.resultCount} result{card.resultCount === "1" ? "" : "s"}
          </span>
        ) : null}
      </div>

      {card.query !== null ? (
        <p className="truncate text-[12px] text-fg-secondary" title={card.query}>
          {card.query}
        </p>
      ) : null}

      {card.detail !== null ? (
        <p className="text-[12px] leading-[1.5] text-fg-secondary">{card.detail}</p>
      ) : null}

      {rawDetail !== null ? (
        <details>
          <summary
            className={cn(
              LABEL_CLASS,
              "cursor-pointer text-fg-tertiary hover:text-fg-secondary",
              STATE_TRANSITION_CLASS,
            )}
          >
            Detail
          </summary>
          <pre className="mt-1 overflow-x-auto rounded-[4px] bg-bg-inset p-2 text-[10.5px] leading-[1.5] text-fg-tertiary">
            {rawDetail}
          </pre>
        </details>
      ) : null}
    </li>
  );
}
