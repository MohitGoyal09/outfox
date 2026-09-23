"use client";


import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  buildToolCallCards,
  groupEventsIntoTurns,
  turnWallDurationMs,
  type PersistedEvent,
  type ToolCallCardView,
} from "./ask-model";

const EVENTS_LIMIT = 200;

export function useAskTraceEvents(threadKey: string | null): PersistedEvent[] | undefined {
  return useQuery(
    api.agentEvents.listEvents,
    threadKey === null ? "skip" : { threadKey, limit: EVENTS_LIMIT },
  );
}

function finishedTurnGroups(events: PersistedEvent[]): PersistedEvent[][] {
  const groups = groupEventsIntoTurns(events);
  const hasTrailingLiveGroup = groups.length > 0 && !groups[groups.length - 1].some((event) => event.kind === "answer");
  return hasTrailingLiveGroup ? groups.slice(0, -1) : groups;
}

export type AssistantTurnTrace = {
  cards: ToolCallCardView[];
  durationMs: number | null;
};

const PAIRING_TOLERANCE_MS = 1000;

export function tracesByAssistantMessageId(
  assistantMessages: { id: string; createdAt: string }[],
  events: PersistedEvent[],
): Record<string, AssistantTurnTrace> {
  const groups = finishedTurnGroups(events);
  const traces: Record<string, AssistantTurnTrace> = {};
  let groupIndex = 0;
  for (const message of assistantMessages) {
    if (groupIndex >= groups.length) break;
    const group = groups[groupIndex]!;
    const groupTime = new Date(group[group.length - 1]!.createdAt).getTime();
    const messageTime = new Date(message.createdAt).getTime();
    if (!Number.isFinite(groupTime) || !Number.isFinite(messageTime)) continue;
    if (groupTime > messageTime + PAIRING_TOLERANCE_MS) continue;
    traces[message.id] = { cards: buildToolCallCards(group), durationMs: turnWallDurationMs(group) };
    groupIndex += 1;
  }
  return traces;
}
