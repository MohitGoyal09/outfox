"use client";

import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { CONTROL_SHELL_CLASS, VALUE_CLASS } from "@/components/drishti/tokens";
import { Meter } from "@/components/ui/meter";
import { creditsChipView, type LiveCredits } from "./creditsChipLogic";

export function CreditsChip() {
  const fallback = useQuery(api.runs.latestCredits, {});
  const getAccountCredits = useAction(api.credits.getAccountCredits);
  const [live, setLive] = useState<LiveCredits>(null);

  useEffect(() => {
    let cancelled = false;
    getAccountCredits({})
      .then((result) => {
        if (!cancelled) setLive(result);
      })
      .catch(() => {
        if (!cancelled) setLive({ ok: false, error: "The live credits check failed." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { text, tone, meter } = creditsChipView(live, fallback);
  const leftCount = /^\d+/.exec(text)?.[0];
  const shortText = leftCount ? `${leftCount} left` : "Credits";
  return (
    <span
      className={cn(
        CONTROL_SHELL_CLASS,
        "shrink-0 cursor-default select-none px-2 hover:border-border sm:px-3",
        tone === "danger" && "border-danger text-danger",
      )}
      aria-label="SerpApi credits remaining this month"
    >
      <span className={cn(VALUE_CLASS, tone === "danger" ? "text-danger" : "text-fg-secondary", "hidden sm:inline")}>
        {text}
      </span>
      <span className={cn(VALUE_CLASS, tone === "danger" ? "text-danger" : "text-fg-secondary", "sm:hidden")} aria-hidden="true">
        {shortText}
      </span>
      {meter ? (
        <Meter
          value={meter.left}
          max={meter.total}
          fill={meter.fill}
          aria-label="SerpApi searches left"
          className="hidden sm:block"
        />
      ) : null}
    </span>
  );
}
