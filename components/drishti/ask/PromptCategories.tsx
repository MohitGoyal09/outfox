"use client";


import { BadgePercent, GitCompare, History, Quote, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATE_TRANSITION_CLASS, iconProps } from "../tokens";

type Suggestion = { id: string; question: string; icon: LucideIcon };

const SUGGESTIONS: Suggestion[] = [
  {
    id: "discounts",
    question: "Which rival leans hardest on discount hooks?",
    icon: BadgePercent,
  },
  {
    id: "compare",
    question: "Compare two of my brands",
    icon: GitCompare,
  },
  {
    id: "changed",
    question: "What changed since the last check?",
    icon: History,
  },
  {
    id: "evidence",
    question: "Show the evidence behind the top hook.",
    icon: Quote,
  },
];

export function PromptCategories({
  onSelect,
  disabled,
}: {
  onSelect: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="w-full text-left">
      <p className="type-label text-fg-tertiary">Try asking</p>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(suggestion.question)}
              className={cn(
                "group flex items-center gap-3 rounded-lg border border-border bg-bg-inset p-3 text-left",
                "motion-safe:transition-[box-shadow,border-color,background-color,transform] motion-safe:duration-150 motion-safe:ease-out",
                "hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-raised hover:shadow-[var(--shadow-md)]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-border disabled:hover:bg-bg-inset disabled:hover:shadow-none",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md bg-bg-raised text-fg-secondary",
                  STATE_TRANSITION_CLASS,
                  "group-hover:bg-accent group-hover:text-accent-ink",
                )}
              >
                <Icon {...iconProps} size={16} aria-hidden="true" />
              </span>
              <span
                className={cn(
                  "text-[13.5px] leading-5 text-fg-secondary",
                  STATE_TRANSITION_CLASS,
                  "group-hover:text-fg",
                )}
              >
                {suggestion.question}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
