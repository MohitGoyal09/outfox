"use client";


import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { Trail, type TrailStep } from "../Trail";
import { LABEL_CLASS, VALUE_CLASS } from "../tokens";
import { engineLabel, signalClaims, type ClaimDoc } from "./brand-model";

export type SignalsPanelProps = {
  claims: ClaimDoc[];
  isLoading?: boolean;
  className?: string;
};

function toStep(claim: ClaimDoc): TrailStep {
  return {
    id: String(claim._id),
    label: claim.metric ?? claim.sourceEngine,
    value: claim.value ?? null,
    reasoning: claim.text,
    href: claim.evidenceUrl,
    meta: { at: claim.fetchedAt },
  };
}

export function SignalsPanel({
  claims,
  isLoading = false,
  className,
}: SignalsPanelProps) {
  const [engine, setEngine] = useState<string | null>(null);
  const signals = useMemo(() => signalClaims(claims), [claims]);
  const engines = useMemo(
    () => [...new Set(signals.map((claim) => claim.sourceEngine))].sort(),
    [signals],
  );
  const filtered = useMemo(
    () =>
      engine === null
        ? signals
        : signals.filter((claim) => claim.sourceEngine === engine),
    [signals, engine],
  );

  return (
    <section id="signals" className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
            engine
          </span>
          <Chip
            label="All"
            dot={false}
            pressed={engine === null}
            onClick={() => setEngine(null)}
          />
          {engines.map((value) => (
            <Chip
              key={value}
              label={engineLabel(value)}
              dot={false}
              pressed={engine === value}
              onClick={() => setEngine(value)}
            />
          ))}
        </div>
        <span className={cn(VALUE_CLASS, "text-[11.5px] text-[var(--text-tertiary,#64646f)]")}>
          {filtered.length} of {signals.length} claims
        </span>
      </div>

      <Trail
        steps={filtered.map(toStep)}
        density="vertical"
        loading={isLoading}
        emptyLabel={
          engine === null
            ? "No evidence recorded for this run."
            : "No claims from this engine in the latest run."
        }
      />
    </section>
  );
}
