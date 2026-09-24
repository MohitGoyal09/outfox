"use client";


import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_CLASS } from "../tokens";
import { toolTitle } from "./ToolCallCard";
import type { ToolCallCardView } from "./ask-model";

type FailureKind = "no_data" | "unavailable" | "error";

const FAILURE_TAG_RE = /^\[(no_data|unavailable|error)\]\s*/;

function severityOf(kind: FailureKind): "calm" | "fault" {
  return kind === "error" ? "fault" : "calm";
}

function decodeFailure(detail: string | null): { kind: FailureKind; text: string } {
  if (detail === null) return { kind: "no_data", text: "returned no data." };
  const match = FAILURE_TAG_RE.exec(detail);
  if (match !== null) return { kind: match[1] as FailureKind, text: detail.slice(match[0].length) };
  return { kind: "error", text: "Something went wrong running this step." };
}

export function UnavailableBlock({
  failedSteps,
  noGroundedEvidence,
}: {
  failedSteps: ToolCallCardView[];
  noGroundedEvidence: boolean;
}) {
  if (failedSteps.length === 0 && !noGroundedEvidence) return null;

  const decoded = failedSteps.map((step) => ({ step, ...decodeFailure(step.detail) }));
  const isFault = decoded.some(({ kind }) => severityOf(kind) === "fault");

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-2 rounded-[8px] border px-3.5 py-3",
        isFault ? "border-danger/30 bg-danger/[0.06]" : "border-weak/30 bg-weak/[0.06]",
      )}
    >
      <div className="flex items-center gap-1.5">
        <TriangleAlert aria-hidden="true" className={cn("size-3.5 shrink-0", isFault ? "text-danger" : "text-weak")} />
        <span className={cn(LABEL_CLASS, isFault ? "text-danger" : "text-weak")}>
          {isFault ? "What failed" : "What the data couldn’t show"}
        </span>
      </div>
      <ul className="flex flex-col gap-1 text-[12.5px] leading-[1.5] text-fg-secondary">
        {decoded.map(({ step, kind, text }) => (
          <li key={step.id} className="flex items-start gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                "mt-[6px] size-1.5 shrink-0 rounded-full",
                severityOf(kind) === "fault" ? "bg-danger" : "bg-weak",
              )}
            />
            <span>
              <span className="font-medium text-fg">{toolTitle(step.name)}</span>
              {": "}
              {text}
            </span>
          </li>
        ))}
        {noGroundedEvidence ? (
          <li className="flex items-start gap-1.5">
            <span aria-hidden="true" className="mt-[6px] size-1.5 shrink-0 rounded-full bg-weak" />
            <span>No evidence, saved or freshly checked, was enough for a confident answer.</span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
