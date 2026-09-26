"use client";


import { cn } from "@/lib/utils";
import { STATE_TRANSITION_CLASS } from "../tokens";

export function FollowUpList({
  followUps,
  onSelect,
}: {
  followUps: string[];
  onSelect: (question: string) => void;
}) {
  if (followUps.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {followUps.map((question, index) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          className={cn(
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
            "inline-flex items-center rounded-md border border-border px-2.5 py-1 text-left text-[12px] text-fg-secondary",
            STATE_TRANSITION_CLASS,
            "hover:border-border-strong hover:bg-bg-inset hover:text-fg",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            "active:translate-y-[0.5px]",
          )}
          style={{ animationDuration: "250ms", animationDelay: `${index * 90}ms`, animationFillMode: "backwards" }}
        >
          {question}
        </button>
      ))}
    </div>
  );
}
