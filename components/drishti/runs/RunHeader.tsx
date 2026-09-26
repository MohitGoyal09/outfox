"use client";

import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import {
  Chip,
  LABEL_CLASS,
  Panel,
  Skeleton,
  SkeletonRegion,
  TONE_COLOR,
  VALUE_CLASS,
  iconProps,
} from "@/components/drishti";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { cn } from "@/lib/utils";
import { RUN_STATUS_TONE, engineCellTone, formatRunDateTime } from "./labels";
import { UsageMeter } from "./UsageMeter";
import type { EngineGap, RunStatus } from "./types";

export type RunHeaderProps = {
  cohortName: string;
  requestedAt: string | null | undefined;
  status: RunStatus;
  errorMessage?: string | null;
  gaps: readonly EngineGap[];
  requestCount: number | null | undefined;
  llmRequestCount: number | null | undefined;
  llmTokenCount: number | null | undefined;
  creditsUsed: number | null | undefined;
  creditsReported: boolean | null | undefined;
  exactCostUsd: number | null | undefined;
  estimatedCostUsd: number | null | undefined;
  loading?: boolean;
  action?: ReactNode;
};

export function RunHeader({
  cohortName,
  requestedAt,
  status,
  errorMessage = null,
  gaps,
  requestCount,
  llmRequestCount,
  llmTokenCount,
  creditsUsed,
  creditsReported,
  exactCostUsd,
  estimatedCostUsd,
  loading = false,
  action,
}: RunHeaderProps) {
  if (loading) {
    return (
      <Panel interactive={false} className="p-6" ariaLabel="Loading the run">
        <SkeletonRegion label="Loading the run">
          <div className="flex flex-col gap-3">
            <Skeleton variant="text" width="38%" height={26} />
            <Skeleton variant="text" width="60%" height={12} />
          </div>
        </SkeletonRegion>
      </Panel>
    );
  }

  const trailing =
    gaps.length === 0 ? undefined : (
      <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {gaps.map((gap) => (
          <span
            key={gap.engine}
            className="inline-flex items-center gap-1.5"
            title={gap.reason}
          >
            <PlatformLogo engine={gap.engine} className="size-3" />
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: TONE_COLOR[engineCellTone(gap.status)] }}
            />
            <span
              className={cn(
                LABEL_CLASS,
                "text-[var(--text-secondary)]",
              )}
            >
              {gap.label} {gap.status === "failed" ? "failed" : gap.status === "missing" ? "not recorded" : "unavailable"}
            </span>
          </span>
        ))}
      </span>
    );

  return (
    <Panel interactive={false} className="p-6" ariaLabel="Run summary">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="type-display text-fg">
              {cohortName}
            </h1>
            <span
              className={cn(
                VALUE_CLASS,
                "text-[12px] text-[var(--text-secondary)]",
              )}
            >
              run of {formatRunDateTime(requestedAt)}
            </span>
          </div>

          <UsageMeter
            className="mt-3"
            requestCount={requestCount}
            llmRequestCount={llmRequestCount}
            llmTokenCount={llmTokenCount}
            creditsUsed={creditsUsed}
            creditsReported={creditsReported}
            exactCostUsd={exactCostUsd}
            estimatedCostUsd={estimatedCostUsd}
            {...(trailing !== undefined ? { trailing } : {})}
          />

          {errorMessage !== null && errorMessage.trim() !== "" ? (
            <p
              role="alert"
              className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-[1.5] text-[var(--danger)]"
            >
              <CircleAlert
                {...iconProps}
                size={14}
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              <span>{errorMessage}</span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <Chip tone={RUN_STATUS_TONE[status]} label={status} size="md" />
          {action}
        </div>
      </div>
    </Panel>
  );
}
