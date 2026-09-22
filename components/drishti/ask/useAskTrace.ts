"use client";


import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  buildToolCallCards,
  groupEventsIntoTurns,
  type PersistedEvent,
  type ToolCallCardView,
} from "./ask-model";

const EVENTS_LIMIT = 200;

export function useAskTraceEvents(threadKey: string): PersistedEvent[] | undefined {
  return useQuery(api.agentEvents.listEvents, { threadKey, limit: EVENTS_LIMIT });
}

export function toolCardsByAssistantTurn(events: PersistedEvent[]): ToolCallCardView[][] {
  const groups = groupEventsIntoTurns(events);
  const hasTrailingLiveGroup = groups.length > 0 && !groups[groups.length - 1].some((event) => event.kind === "answer");
  const finished = hasTrailingLiveGroup ? groups.slice(0, -1) : groups;
  return finished.map((group) => buildToolCallCards(group));
}
