"use client";


import {
  Compass,
  Database,
  GitCompare,
  Globe,
  type LucideIcon,
  MessageSquareText,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_CLASS, STATE_TRANSITION_CLASS, TONE_COLOR, formatLatency } from "../tokens";
import type { ToolCallCardView } from "./ask-model";

const STATUS_LABEL: Record<ToolCallCardView["status"], string> = {
  pending: "pending",
  running: "running…",
  complete: "complete",
  failed: "failed",
  skipped: "skipped",
};

const TOOL_META: Record<string, { icon: LucideIcon; title: string }> = {
  resolve_brand: { icon: Compass, title: "Looked up a brand" },
  search_claims: { icon: Database, title: "Checked stored evidence" },
  get_trends: { icon: TrendingUp, title: "Checked search trends" },
  compare_brands: { icon: GitCompare, title: "Compared brands" },
  web_search: { icon: Globe, title: "Searched the web" },
  refresh_cohort: { icon: RefreshCw, title: "Requested a live refresh" },
};
const DEFAULT_TOOL_META = { icon: MessageSquareText, title: "Ran a step" };

function subjectOf(name: string, rawPayload: unknown): string | null {
  if (typeof rawPayload !== "object" || rawPayload === null) return null;
  const input = rawPayload as Record<string, unknown>;
  if ((name === "resolve_brand" || name === "web_search") && typeof input.query === "string") {
    return input.query;
  }
  if (Array.isArray(input.brandIds) && input.brandIds.length > 0) {
    return `${input.brandIds.length} brand${input.brandIds.length === 1 ? "" : "s"}`;
  }
  if (typeof input.dimension === "string") return input.dimension.replaceAll("_", " ");
  return null;
}

export function ToolCallCard({ card }: { card: ToolCallCardView }) {
  const duration = formatLatency(card.durationMs);
  const meta = TOOL_META[card.name] ?? DEFAULT_TOOL_META;
  const Icon = meta.icon;
  const subject = subjectOf(card.name, card.rawPayload);
  const rawDetail =
    card.rawPayload !== null &&
    card.rawPayload !== undefined &&
    Object.keys(card.rawPayload as Record<string, unknown>).length > 0
      ? JSON.stringify(card.rawPayload, null, 2)
      : null;

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute left-[13px] top-7 bottom-0 w-px bg-border last:hidden"
      />
      <span
        className={cn(
          "relative z-10 flex size-[26px] shrink-0 items-center justify-center rounded-full border bg-bg-raised",
          card.status === "failed" ? "border-danger/40" : "border-border",
        )}
      >
        <Icon className="size-3.5 text-fg-secondary" aria-hidden="true" />
        <span
          aria-hidden="true"
          className={cn("absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-bg", STATE_TRANSITION_CLASS)}
          style={{ backgroundColor: TONE_COLOR[card.tone] }}
        />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[13px] font-medium leading-5 text-fg">
          {meta.title}
          {subject !== null ? <span className="text-fg-secondary"> · {subject}</span> : null}
        </p>
        <div className={cn(LABEL_CLASS, "mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-fg-tertiary")}>
          <span>{card.name}</span>
          <span aria-hidden="true">·</span>
          <span>{STATUS_LABEL[card.status]}</span>
          {duration !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{duration}</span>
            </>
          ) : null}
          {card.resultCount !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {card.resultCount} result{card.resultCount === "1" ? "" : "s"}
              </span>
            </>
          ) : null}
        </div>

        {card.detail !== null ? (
          <p className="mt-1 text-[12px] leading-[1.5] text-fg-secondary">{card.detail}</p>
        ) : null}

        {rawDetail !== null ? (
          <details className="mt-1">
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
      </div>
    </li>
  );
}
