"use client";


import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Trail, type TrailStep } from "../Trail";
import { LABEL_CLASS, STATE_TRANSITION_CLASS, iconProps } from "../tokens";
import type { ToolCallCardView } from "./ask-model";
import { toolIcon, toolSourceLabel, STATUS_LABEL, subjectOf, toolTitle } from "./ToolCallCard";
import { useLiveStepTimings } from "./useLiveStepTimings";

const EMPTY_CARDS: ToolCallCardView[] = [];

function trailStepFromCard(card: ToolCallCardView): TrailStep {
  const subject = subjectOf(card.name, card.rawPayload);
  const hasDetail =
    (card.rawPayload !== null &&
      card.rawPayload !== undefined &&
      Object.keys(card.rawPayload as Record<string, unknown>).length > 0) ||
    card.resultCount !== null;
  return {
    id: card.id,
    label: toolSourceLabel(card.name),
    value: null,
    tone: card.tone,
    icon: toolIcon(card.name),
    sentence: subject !== null ? `${toolTitle(card.name)} — ${subject}` : toolTitle(card.name),
    reasoning: card.status === "failed" && card.detail !== null ? card.detail : undefined,
    statusLabel: STATUS_LABEL[card.status],
    meta: { latencyMs: card.durationMs ?? undefined },
    detail: hasDetail
      ? { args: (card.rawPayload as Record<string, unknown> | null) ?? null, result: card.resultCount }
      : undefined,
  };
}

export function StepTrace({
  cards: rawCards,
  isRunning,
  isLive,
}: {
  cards: ToolCallCardView[];
  isRunning: boolean;
  isLive: boolean;
}) {
  const liveElapsed = useLiveStepTimings(isLive ? rawCards : EMPTY_CARDS);
  const cards = isLive
    ? rawCards.map((card) => ({
        ...card,
        durationMs: card.durationMs ?? liveElapsed.get(card.id) ?? null,
      }))
    : rawCards;

  return <StepTraceBody cards={cards} isRunning={isRunning} />;
}

function StepTraceBody({ cards, isRunning }: { cards: ToolCallCardView[]; isRunning: boolean }) {
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const [prevIsRunning, setPrevIsRunning] = useState(isRunning);
  if (isRunning !== prevIsRunning) {
    setPrevIsRunning(isRunning);
    setManualOpen(null);
  }
  const open = manualOpen ?? isRunning;

  if (cards.length === 0) return null;

  const steps = cards.map(trailStepFromCard);

  if (cards.length === 1) {
    return (
      <Trail
        className="rounded-[8px] border border-border bg-bg-inset px-3 py-2.5"
        steps={steps}
        density="vertical"
      />
    );
  }

  const headerIcons = [...new Map(cards.map((card) => [toolIcon(card.name), toolIcon(card.name)])).values()].slice(
    0,
    4,
  );

  return (
    <details
      className="rounded-[8px] border border-border bg-bg-inset"
      open={open}
      onToggle={(event) => setManualOpen(event.currentTarget.open)}
    >
      <summary
        className={cn(
          "flex cursor-pointer select-none items-center gap-2 px-3 py-2",
          "[&::-webkit-details-marker]:hidden",
          STATE_TRANSITION_CLASS,
        )}
      >
        <span className="flex items-center" aria-hidden="true">
          {headerIcons.map((Icon, index) => (
            <span
              key={index}
              className="flex size-5 items-center justify-center rounded-full border border-border bg-bg-raised text-fg-secondary"
              style={index > 0 ? { marginLeft: "-6px" } : undefined}
            >
              <Icon {...iconProps} size={11} aria-hidden="true" />
            </span>
          ))}
        </span>
        <span className={cn(LABEL_CLASS, "text-fg-tertiary hover:text-fg-secondary")}>
          {isRunning ? `${cards.length} steps so far…` : `Used ${cards.length} tools`}
        </span>
        <ChevronDown
          {...iconProps}
          size={14}
          aria-hidden="true"
          className={cn(
            "ml-auto size-3.5 text-fg-tertiary",
            "[details[open]_&]:rotate-180 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out",
          )}
        />
      </summary>
      <div className="border-t border-border px-3 pt-3 pb-1">
        <Trail steps={steps} density="vertical" />
      </div>
    </details>
  );
}
