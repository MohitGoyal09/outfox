"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { CONTROL_SHELL_CLASS, VALUE_CLASS } from "@/components/drishti/tokens";
import { creditsChipView } from "./creditsChipLogic";

export function CreditsChip() {
  const credits = useQuery(api.runs.latestCredits, {});
  const { text, tone } = creditsChipView(credits);
  return (
    <span
      className={cn(
        CONTROL_SHELL_CLASS,
        "shrink-0 cursor-default select-none hover:border-border",
        tone === "danger" && "border-danger text-danger",
      )}
      aria-label="SerpApi credits remaining this month"
    >
      <span className={cn(VALUE_CLASS, tone === "danger" ? "text-danger" : "text-fg-secondary")}>
        {text}
      </span>
    </span>
  );
}
