"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";

export type WorkflowStepState =
  | "pending"
  | "running"
  | "complete"
  | "failed";

export type WorkflowStep = {
  id: string;
  capability?: string;
  status: WorkflowStepState;
  error?: string;
};

export function stepStateFromToolState(toolState: string): WorkflowStepState {
  if (toolState === "output-available") return "complete";
  if (toolState === "output-error" || toolState === "output-denied")
    return "failed";
  if (
    toolState === "input-streaming" ||
    toolState === "input-available" ||
    toolState === "approval-requested" ||
    toolState === "approval-responded"
  )
    return "running";
  return "pending";
}

export function WorkflowProgress({
  steps,
  title = "Workflow",
  className,
}: {
  steps: WorkflowStep[];
  title?: string;
  className?: string;
}) {
  if (steps.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No workflow steps yet. Ask the agent something to start a plan.
      </div>
    );
  }
  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {step.status === "running" ? (
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              ) : step.status === "complete" ? (
                <CheckIcon className="size-4 text-primary" />
              ) : step.status === "failed" ? (
                <XIcon className="size-4 text-destructive" />
              ) : (
                <span className="block size-4 rounded-full border border-border" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{step.id}</span>
                {step.capability ? (
                  <Badge variant="secondary">{step.capability}</Badge>
                ) : null}
                <Badge
                  variant={
                    step.status === "failed" ? "destructive" : "outline"
                  }
                >
                  {step.status === "running"
                    ? "started"
                    : step.status === "complete"
                      ? "finished"
                      : step.status}
                </Badge>
              </span>
              {step.error ? (
                <span className="mt-1 block text-xs text-destructive">
                  {step.error}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
