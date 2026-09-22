"use client";


import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_CLASS } from "../tokens";
import { toolTitle } from "./ToolCallCard";
import type { ToolCallCardView } from "./ask-model";

export function UnavailableBlock({
  failedSteps,
  noGroundedEvidence,
}: {
  failedSteps: ToolCallCardView[];
  noGroundedEvidence: boolean;
}) {
  if (failedSteps.length === 0 && !noGroundedEvidence) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-[8px] border border-weak/30 bg-weak/[0.06] px-3.5 py-3"
    >
      <div className="flex items-center gap-1.5">
        <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0 text-weak" />
        <span className={cn(LABEL_CLASS, "text-weak")}>What the data couldn&rsquo;t show</span>
      </div>
      <ul className="flex flex-col gap-1 text-[12.5px] leading-[1.5] text-fg-secondary">
        {failedSteps.map((step) => (
          <li key={step.id}>
            <span className="font-medium text-fg">{toolTitle(step.name)}</span>
            {": "}
            {step.detail ?? "returned no data for this turn."}
          </li>
        ))}
        {noGroundedEvidence ? (
          <li>No stored or live evidence backed a confident answer this turn.</li>
        ) : null}
      </ul>
    </div>
  );
}
