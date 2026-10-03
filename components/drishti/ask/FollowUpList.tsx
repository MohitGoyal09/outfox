"use client";


import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { stripEmDashes } from "@/lib/noEmDash";
import { FOCUS_RING_CLASS, STATE_TRANSITION_CLASS } from "../tokens";

export function FollowUpList({
  followUps,
  onSelect,
}: {
  followUps: string[];
  onSelect: (question: string) => void;
}) {
  if (followUps.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-0.5">
      {followUps.map((question, index) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          className={cn(
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-raised py-1.5 pl-3 pr-2.5 text-left text-[13px] text-fg-secondary shadow-[var(--shadow-xs)]",
            STATE_TRANSITION_CLASS,
            "hover:border-border-strong hover:text-fg hover:shadow-[var(--shadow-sm)]",
            FOCUS_RING_CLASS,
            "active:translate-y-[0.5px]",
          )}
          style={{ animationDuration: "250ms", animationDelay: `${index * 90}ms`, animationFillMode: "backwards" }}
        >
          {stripEmDashes(question)}
          <ArrowRight aria-hidden className="size-3.5 shrink-0 text-fg-tertiary" />
        </button>
      ))}
    </div>
  );
}
