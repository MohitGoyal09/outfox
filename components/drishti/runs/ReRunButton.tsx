"use client";

import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LABEL_CLASS, PillButton, VALUE_CLASS, iconProps } from "@/components/drishti";
import { cn } from "@/lib/utils";
import { formatCount, formatUsd } from "./labels";

export type ReRunEstimate = {
  searches: number | null;
  costUsd: number | null;
  costLabel: string;
};

export type ReRunButtonProps = {
  brandIds: readonly string[];
  estimate: ReRunEstimate;
  disabledReason?: string | null;
  className?: string;
};

export function ReRunButton({
  brandIds,
  estimate,
  disabledReason = null,
  className,
}: ReRunButtonProps) {
  const runComparison = useAction(api.pipeline.runComparison.runComparison);
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = disabledReason !== null && disabledReason !== "";

  async function start(): Promise<void> {
    if (blocked) return;
    setRunning(true);
    setError(null);
    try {
      const result = await runComparison({
        brandIds: brandIds as Id<"brands">[],
        mode: "live",
        refreshAuthorized: true,
      });
      setConfirming(false);
      router.push(`/runs/${encodeURIComponent(String(result.runId))}`);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.trim() !== ""
          ? cause.message
          : "The re-run did not start.",
      );
    } finally {
      setRunning(false);
    }
  }

  if (!confirming) {
    return (
      <div className={cn("flex flex-col items-end gap-1.5", className)}>
        <PillButton
          size="sm"
          variant="outline"
          disabled={blocked || running}
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          title={blocked ? (disabledReason ?? undefined) : "Re-run this cohort"}
        >
          <RefreshCw {...iconProps} size={14} aria-hidden="true" />
          Re-run
        </PillButton>
        {blocked ? (
          <p className="max-w-[34ch] text-right text-[12px] leading-[1.45] text-fg-tertiary">
            {disabledReason}
          </p>
        ) : null}
        {error !== null ? (
          <p role="alert" className="max-w-[42ch] text-right text-[12px] leading-[1.45] text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Confirm the re-run"
      className={cn(
        "w-full max-w-[46ch] rounded-sm border border-border bg-bg-raised p-4",
        className,
      )}
    >
      <p className={cn(LABEL_CLASS, "text-fg-secondary")}>
        confirm live re-run
      </p>
      <p className="mt-2 text-[13px] leading-[1.5] text-fg-secondary">
        The last run used{" "}
        <span className={cn(VALUE_CLASS, "text-fg")}>
          {estimate.searches === null
            ? "an unreported number of searches"
            : `${formatCount(estimate.searches)} searches`}
        </span>{" "}
        and{" "}
        <span className={cn(VALUE_CLASS, "text-fg")}>
          {estimate.costUsd === null
            ? "an unreported model cost"
            : `${formatUsd(estimate.costUsd)} ${estimate.costLabel}`}
        </span>
        . A re-run asks the same queries, so the same spend is the estimate.
      </p>

      {error !== null ? (
        <p
          role="alert"
          className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-[1.5] text-danger"
        >
          <TriangleAlert
            {...iconProps}
            size={14}
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0"
          />
          <span>{error}</span>
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PillButton size="sm" disabled={running} onClick={() => void start()}>
          <RefreshCw {...iconProps} size={14} aria-hidden="true" className={running ? "animate-spin" : undefined} />
          {running ? "Running" : "Confirm re-run"}
        </PillButton>
        <PillButton size="sm" variant="outline" disabled={running} onClick={() => setConfirming(false)}>
          Cancel
        </PillButton>
      </div>
    </div>
  );
}
