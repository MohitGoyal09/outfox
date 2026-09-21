"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { Chip } from "@/components/drishti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className={cn("rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted-foreground", className)}>
        No workflow steps yet. Ask the agent something to start a plan.
      </div>
    );
  }
  return (
    <Card aria-label={title} className={cn("border-border/80 bg-card shadow-none", className)}>
      <CardHeader className="border-b border-border/70 px-5 py-4"><CardTitle className="text-sm font-semibold tracking-[-0.01em]">{title}</CardTitle></CardHeader>
      <CardContent className="p-5"><ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start gap-3 border-b border-[var(--border)] py-3 text-sm last:border-b-0"
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
                <span className="font-medium text-[var(--text-primary)]">{step.id}</span>
                {step.capability ? (
                  <Chip dot={false} label={step.capability} />
                ) : null}
                <Chip tone={step.status === "failed" ? "danger" : step.status === "complete" ? "ok" : step.status === "running" ? "warn" : "neutral"} label={step.status === "running"
                    ? "started"
                    : step.status === "complete"
                      ? "finished"
                      : step.status} />
              </span>
              {step.error ? (
                <span className="mt-1 block text-xs text-destructive">
                  {step.error}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul></CardContent>
    </Card>
  );
}
