"use client";


import { CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_CLASS, STATE_TRANSITION_CLASS, iconProps } from "../tokens";

export function FollowUpList({
  followUps,
  onSelect,
}: {
  followUps: string[];
  onSelect: (question: string) => void;
}) {
  if (followUps.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>Follow-ups</span>
      <div className="flex flex-wrap gap-1.5">
        {followUps.map((question, index) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className={cn(
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
              "inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-raised px-2.5 py-1 text-left text-[12.5px] text-fg-secondary shadow-[var(--shadow-xs)]",
              STATE_TRANSITION_CLASS,
              "hover:border-border-strong hover:bg-bg-inset hover:text-fg",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              "active:translate-y-[0.5px]",
            )}
            style={{ animationDuration: "250ms", animationDelay: `${index * 90}ms`, animationFillMode: "backwards" }}
          >
            <CornerDownLeft {...iconProps} className="size-3.5 shrink-0 text-fg-tertiary" aria-hidden="true" />
            <span>{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
