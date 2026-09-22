"use client";


import { cn } from "@/lib/utils";
import { LABEL_CLASS, STATE_TRANSITION_CLASS } from "../tokens";
import { buildToolCallCards, type PersistedEvent } from "./ask-model";
import { ToolCallCard } from "./ToolCallCard";

function planGoalOf(events: PersistedEvent[]): string | null {
  const plan = events.find((event) => event.kind === "plan");
  if (plan === undefined || typeof plan.payload !== "object" || plan.payload === null) return null;
  const goal = (plan.payload as Record<string, unknown>).goal;
  return typeof goal === "string" && goal.trim() !== "" ? goal : null;
}

export function AskReasoning({
  events,
  defaultOpen = false,
}: {
  events: PersistedEvent[];
  defaultOpen?: boolean;
}) {
  const cards = buildToolCallCards(events);
  const goal = planGoalOf(events);
  if (cards.length === 0 && goal === null) return null;

  return (
    <details
      className="rounded-[8px] border border-border bg-bg-inset"
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary
        className={cn(
          LABEL_CLASS,
          "cursor-pointer select-none px-3 py-2 text-fg-tertiary hover:text-fg-secondary",
          STATE_TRANSITION_CLASS,
        )}
      >
        Reasoning · {cards.length} step{cards.length === 1 ? "" : "s"}
      </summary>
      <div className="flex flex-col gap-2 border-t border-border px-3 py-2.5">
        {goal !== null ? <p className="text-[12px] italic text-fg-tertiary">{goal}</p> : null}
        <ul className="flex flex-col gap-2">
          {cards.map((card) => (
            <ToolCallCard key={card.id} card={card} />
          ))}
        </ul>
      </div>
    </details>
  );
}
