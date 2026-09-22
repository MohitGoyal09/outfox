"use client";


import { Database, GitCompare, TrendingUp, type LucideIcon } from "lucide-react";

type Suggestion = { id: string; label: string; icon: LucideIcon; prompt: string };

const SUGGESTIONS: Suggestion[] = [
  {
    id: "compare",
    label: "Compare two brands",
    icon: GitCompare,
    prompt: "Compare two of my tracked brands.",
  },
  {
    id: "trends",
    label: "Check search trends",
    icon: TrendingUp,
    prompt: "How has search interest changed for this brand?",
  },
  {
    id: "evidence",
    label: "See the evidence",
    icon: Database,
    prompt: "Show the evidence behind the top hook.",
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
    <div className="w-full text-center">
      <p className="type-label text-fg-tertiary">Try asking</p>
      <div className="mt-2.5 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(suggestion.prompt)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-raised px-3.5 py-2 text-[12.5px] font-medium text-fg-secondary transition-[transform,box-shadow,border-color,color] duration-150 ease-out hover:-translate-y-0.5 hover:border-accent/30 hover:text-fg hover:shadow-[var(--shadow-lift)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <Icon className="size-3.5 text-accent" aria-hidden="true" />
              {suggestion.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
