"use client";

import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button, LABEL_CLASS, Panel, VALUE_CLASS, iconProps } from "@/components/drishti";
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
        <Button
          size="sm"
          disabled={blocked || running}
          error={error !== null}
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          icon={<RefreshCw {...iconProps} size={14} />}
          title={blocked ? (disabledReason ?? undefined) : "Re-run this cohort"}
        >
          Re-run
        </Button>
        {blocked ? (
          <p className="max-w-[34ch] text-right text-[12px] leading-[1.45] text-[var(--text-tertiary,#64646f)]">
            {disabledReason}
          </p>
        ) : null}
        {error !== null ? (
          <p role="alert" className="max-w-[42ch] text-right text-[12px] leading-[1.45] text-[var(--danger,#f87171)]">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Panel
      interactive={false}
      ariaLabel="Confirm the re-run"
      className={cn("w-full max-w-[46ch] p-4", className)}
    >
      <p className={cn(LABEL_CLASS, "text-[var(--text-secondary,#9797a3)]")}>
        confirm live re-run
      </p>
      <p className="mt-2 text-[13px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
        The last run used{" "}
        <span className={cn(VALUE_CLASS, "text-[var(--text-primary,#eeeef2)]")}>
          {estimate.searches === null
            ? "an unreported number of searches"
            : `${formatCount(estimate.searches)} searches`}
        </span>{" "}
        and{" "}
        <span className={cn(VALUE_CLASS, "text-[var(--text-primary,#eeeef2)]")}>
          {estimate.costUsd === null
            ? "an unreported model cost"
            : `${formatUsd(estimate.costUsd)} ${estimate.costLabel}`}
        </span>
        . A re-run asks the same queries, so the same spend is the estimate.
      </p>

      {error !== null ? (
        <p
          role="alert"
          className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-[1.5] text-[var(--danger,#f87171)]"
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
        <Button
          size="sm"
          loading={running}
          onClick={() => void start()}
          icon={<RefreshCw {...iconProps} size={14} />}
        >
          {running ? "Running" : "Confirm re-run"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={running}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
