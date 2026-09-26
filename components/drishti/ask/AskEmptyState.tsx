"use client";


import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ConversationEmptyState } from "@/components/ai-elements/conversation";
import { PromptCategories } from "./PromptCategories";

function greetingWord(hour: number): string {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function AskEmptyState({
  firstName,
  composer,
  categoriesDisabled,
  onSelectPrompt,
}: {
  firstName: string | null;
  composer: ReactNode;
  categoriesDisabled: boolean;
  onSelectPrompt: (prompt: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [greeting] = useState(() => greetingWord(new Date().getHours()));

  return (
    <ConversationEmptyState className="flex-1">
      <div className="w-full max-w-2xl space-y-7 text-center">
        <div className="mx-auto max-w-md space-y-5">
          <motion.div
            aria-hidden="true"
            className="relative mx-auto flex size-24 items-center justify-center"
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
          >
            {/* Neutral ink disc, no gradient and no glow: chrome stays
                monochrome (`DESIGN.md` bans decorative gradient blobs). */}
            <span className="relative flex size-14 items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-accent-ink ring-1 ring-border shadow-[var(--shadow-sm)]">
              D
            </span>
          </motion.div>
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
              Ask about your rivals — a comparison, a trend, or the evidence behind
              any signal. Every useful sentence links back to a real tool result.
            </p>
          </div>
        </div>
        <div className="w-full text-left">{composer}</div>
        <PromptCategories disabled={categoriesDisabled} onSelect={onSelectPrompt} />
      </div>
    </ConversationEmptyState>
  );
}
