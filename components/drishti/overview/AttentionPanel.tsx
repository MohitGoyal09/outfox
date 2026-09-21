"use client";

import { CircleAlert, TriangleAlert } from "lucide-react";

import {
  Chip,
  EmptyState,
  LABEL_CLASS,
  Panel,
  Skeleton,
  SkeletonRegion,
  VALUE_CLASS,
  iconProps,
  type Tone,
} from "@/components/drishti";
import { cn } from "@/lib/utils";

import { UsageReadout } from "./UsageReadout";
import {
  pluralize,
  type Attention,
  type AttentionStatus,
  type UsageView,
} from "./digest";

export type AttentionPanelProps = {
  loading: boolean;
  runExists: boolean;
  attention: Attention | null;
  usage: UsageView | null;
};

const STATUS_TONE: Record<AttentionStatus, Tone> = {
  complete: "ok",
  partial: "warn",
  failed: "danger",
  running: "warn",
  unknown: "neutral",
};

function AttentionSkeleton() {
  return (
    <SkeletonRegion label="Loading engines and usage">
      <div className="flex flex-col gap-3">
        <Skeleton variant="pill" width={96} height={20} />
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="64%" />
      </div>
    </SkeletonRegion>
  );
}

export function AttentionPanel({
  loading,
  runExists,
  attention,
  usage,
}: AttentionPanelProps) {
  return (
    <Panel interactive={false} padded ariaLabel="Attention">
      <h3 className="text-[13px] font-medium text-fg">Attention</h3>

      <div className="mt-3">
        {loading ? (
          <AttentionSkeleton />
        ) : !runExists ? (
          <EmptyState
            size="sm"
            bounded
            icon={<TriangleAlert {...iconProps} size={16} aria-hidden="true" />}
            title="Nothing needs attention yet"
            description="After a comparison runs, engines that failed or were unavailable are named here with the reason, alongside the searches and model cost the run used."
          />
        ) : attention === null ? (
          <EmptyState
            size="sm"
            bounded
            title="No engine report for this run yet"
            description="A finished run reports which engines answered and which did not. That report appears here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Chip
                label={`run ${attention.status}`}
                tone={STATUS_TONE[attention.status]}
              />
              <span className={cn(VALUE_CLASS, "text-[12px] text-fg-secondary")}>
                {attention.answeredEngineCount}/{attention.totalEngineCount}{" "}
                {pluralize(
                  attention.totalEngineCount,
                  "engine",
                )}{" "}
                answered
              </span>
            </div>

            {attention.errorMessage ? (
              <p
                role="alert"
                className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-[var(--danger,#f87171)]"
              >
                <CircleAlert
                  {...iconProps}
                  size={14}
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0"
                />
                {attention.errorMessage}
              </p>
            ) : null}

            {attention.status === "running" ? (
              <p className="type-body max-w-[52ch] text-fg-secondary">
                This run is still in progress. Engines report as they answer, and
                the run view fills in below.
              </p>
            ) : attention.gaps.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {attention.gaps.map((gap) => (
                  <li key={gap.engine} className="flex flex-col gap-0.5">
                    <span
                      className={cn(
                        LABEL_CLASS,
                        "flex items-center gap-2 text-fg-secondary",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full border border-fg-tertiary"
                      />
                      {gap.label}
                    </span>
                    <span className="type-caption text-fg-tertiary">
                      {gap.reason}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="type-body max-w-[52ch] text-fg-secondary">
                Every engine returned data for this run.
              </p>
            )}

            {usage ? (
              <div className="mt-1 border-t border-border pt-3">
                <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>
                  Cost and usage
                </span>
                <div className="mt-2">
                  <UsageReadout usage={usage} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Panel>
  );
}
