"use client";


import { useState } from "react";
import { ConversationEmptyState } from "@/components/ai-elements/conversation";
import { ThinkingOrb } from "./ThinkingOrb";
import { PromptCategories } from "./PromptCategories";

function greetingWord(hour: number): string {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function AskEmptyState({
  firstName,
  categoriesDisabled,
  onSelectPrompt,
}: {
  firstName: string | null;
  categoriesDisabled: boolean;
  onSelectPrompt: (prompt: string) => void;
}) {
  const [greeting] = useState(() => greetingWord(new Date().getHours()));

  return (
    <ConversationEmptyState className="flex-1">
      <div className="w-full max-w-3xl space-y-8">
        <div className="mx-auto max-w-xl space-y-5 text-center">
          <ThinkingOrb size={112} state="idle" className="mx-auto block" />
          <div className="space-y-2">
            <h1 className="type-display text-fg">
              {firstName !== null ? (
                <>
                  <span className="font-normal text-fg-secondary">Good {greeting}, </span>
                  {firstName}
                </>
              ) : (
                `Good ${greeting}.`
              )}
            </h1>
            <p className="measure-prose mx-auto text-[15px] leading-6 text-fg-secondary">
              Ask about your rivals: a comparison, a trend, or the evidence behind
              any signal. Every useful sentence links back to a real tool result.
            </p>
          </div>
        </div>
        <PromptCategories disabled={categoriesDisabled} onSelect={onSelectPrompt} />
      </div>
    </ConversationEmptyState>
  );
}
