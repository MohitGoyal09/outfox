"use client";


import {
  Compass,
  Database,
  GitCompare,
  ListChecks,
  type LucideIcon,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Tag,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_CLASS, STATE_TRANSITION_CLASS, TONE_COLOR, formatLatency } from "../tokens";
import type { ToolCallCardView } from "./ask-model";

export const STATUS_LABEL: Record<ToolCallCardView["status"], string> = {
  pending: "pending",
  running: "running…",
  complete: "complete",
  failed: "failed",
  skipped: "skipped",
};

const TOOL_META: Record<string, { icon: LucideIcon; title: string }> = {
  list_brands: { icon: ListChecks, title: "Listing tracked brands" },
  resolve_brand: { icon: Compass, title: "Finding a brand" },
  search_claims: { icon: Database, title: "Reading claims" },
  get_claims: { icon: Database, title: "Reading stored evidence" },
  get_tags: { icon: Tag, title: "Reading content tags" },
  get_coverage: { icon: ListChecks, title: "Checking what data exists" },
  get_trends: { icon: TrendingUp, title: "Reading search interest" },
  compare_brands: { icon: GitCompare, title: "Comparing brands" },
  web_search: { icon: Search, title: "Searching the web" },
  fetch_brand: { icon: RefreshCw, title: "Fetching a brand" },
  add_brand: { icon: Plus, title: "Adding a brand" },
  refresh_cohort: { icon: RefreshCw, title: "Requesting a live refresh" },
  diff_runs: { icon: GitCompare, title: "Comparing the last two runs" },
};
const DEFAULT_TOOL_META = { icon: MessageSquareText, title: "Running a step" };

function brandNamesOf(ids: unknown, brandNames: Record<string, string>): string | null {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  const named = ids.map((id) => brandNames[String(id)]).filter((name): name is string => typeof name === "string");
  if (named.length > 0) return named.join(", ");
  return `${ids.length} brand${ids.length === 1 ? "" : "s"}`;
}

export function descriptiveToolLabel(
  name: string,
  rawPayload: unknown,
  brandNames: Record<string, string>,
): string {
  const input = (typeof rawPayload === "object" && rawPayload !== null ? rawPayload : {}) as Record<string, unknown>;
  if (name === "resolve_brand" && typeof input.query === "string" && input.query.trim() !== "") {
    return `Finding ${input.query}`;
  }
  if (name === "web_search" && typeof input.query === "string" && input.query.trim() !== "") {
    return `Searching the web for "${input.query}"`;
  }
  if (name === "fetch_brand" && typeof input.name === "string" && input.name.trim() !== "") {
    return `Fetching ${input.name}`;
  }
  if (name === "get_trends") {
    const names = brandNamesOf(input.brandIds, brandNames);
    if (names !== null) return `Reading search interest for ${names}`;
  }
  return toolTitle(name);
}

export function toolTitle(name: string): string {
  return (TOOL_META[name] ?? DEFAULT_TOOL_META).title;
}

export function toolIcon(name: string): LucideIcon {
  return (TOOL_META[name] ?? DEFAULT_TOOL_META).icon;
}

export function subjectOf(name: string, rawPayload: unknown): string | null {
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

export function toolSourceLabel(name: string): string {
  const words = name.split("_");
  return words.map((word, index) => (index === 0 ? word[0].toUpperCase() + word.slice(1) : word)).join(" ");
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
              {/* Already a full phrase (e.g. "42 claims, 2 engines" or "no
                  rows") — see `resultSummaryOfOutput`/`buildToolCallCards`,
                  never a bare count appended with a generic "result(s)". */}
              <span>{card.resultCount}</span>
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
