"use client";


import { CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_CLASS, STATE_TRANSITION_CLASS } from "../tokens";

export function FollowUpList({
  followUps,
  onSelect,
}: {
  followUps: string[];
  onSelect: (question: string) => void;
}) {
  if (followUps.length === 0) return null;

  return (
    <div className="flex flex-col">
      <span className={cn(LABEL_CLASS, "mb-1 text-fg-tertiary")}>Follow-ups</span>
      <div className="flex flex-col">
        {followUps.map((question, index) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className={cn(
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
              "flex w-full items-center gap-2 border-b border-border py-2 text-left text-[12.5px] text-fg-secondary last:border-b-0",
              STATE_TRANSITION_CLASS,
              "hover:text-fg",
            )}
            style={{ animationDuration: "250ms", animationDelay: `${index * 90}ms`, animationFillMode: "backwards" }}
          >
            <CornerDownLeft className="size-3.5 shrink-0 text-fg-tertiary" aria-hidden="true" />
            <span>{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
