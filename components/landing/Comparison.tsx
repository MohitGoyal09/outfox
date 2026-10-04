"use client";

import { Check, Minus, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/components/aceternity/motion-utils";
import { cn } from "@/lib/utils";

type Kind = "yes" | "partial" | "no";
type Cell = { kind: Kind; label: string };

const yes = (label: string): Cell => ({ kind: "yes", label });
const no = (label: string): Cell => ({ kind: "no", label });

const ROWS: readonly { label: string; cells: readonly [Cell, Cell, Cell] }[] = [
  { label: "Every number links to its source", cells: [partial("Rarely"), no("No"), yes("Yes")] },
  { label: "Knows when each finding was fetched", cells: [no("No"), no("No"), yes("Yes")] },
  { label: "Hooks and funnel stages tagged", cells: [partial("By hand"), partial("Guessed"), yes("Per finding")] },
  { label: "Says when data is missing", cells: [no("No"), no("No"), yes("Names the gap")] },
  { label: "Ads with run length", cells: [partial("By hand"), no("No"), yes("Yes")] },
  { label: "Untraceable numbers removed", cells: [no("No"), no("No"), yes("Yes")] },
  { label: "Saves evidence to a board", cells: [partial("By hand"), no("No"), yes("Yes")] },
];
const ICON = { yes: Check, partial: Minus, no: X } as const;

function Verdict({ cell, onInk }: { cell: Cell; onInk?: boolean }) {
  const Icon = ICON[cell.kind];
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          onInk ? "bg-white/15 text-accent-ink" : cell.kind === "no" ? "border border-border-strong text-fg-tertiary" : "border border-border-strong text-fg-secondary",
        )}
      >
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      <span className={cn("text-[0.9375rem]", onInk ? "font-medium text-accent-ink" : "text-fg-secondary")}>{cell.label}</span>
    </span>
  );
}
