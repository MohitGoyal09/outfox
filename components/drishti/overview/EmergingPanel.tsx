"use client";

import { ArrowRight, TrendingUp } from "lucide-react";

import {
  Chip,
  EmptyState,
  Panel,
  Skeleton,
  SkeletonRegion,
  VALUE_CLASS,
  iconProps,
} from "@/components/drishti";
import { cn } from "@/lib/utils";

import { ActionLink } from "./ActionLink";
import { pluralize, runHref, type Emerging } from "./digest";

export type EmergingPanelProps = {
  loading: boolean;
  runExists: boolean;
  emerging: Emerging | null;
  cohortKey: string;
};

function EmergingSkeleton() {
  return (
    <SkeletonRegion label="Loading the emerging pattern">
      <div className="flex flex-col gap-3">
        <Skeleton variant="text" width="34%" />
        <Skeleton variant="text" lines={2} />
        <Skeleton variant="text" width="52%" />
      </div>
    </SkeletonRegion>
  );
}

export function EmergingPanel({
  loading,
  runExists,
  emerging,
  cohortKey,
}: EmergingPanelProps) {
  return (
    <Panel interactive={false} padded ariaLabel="Emerging">
      <h3 className="text-[13px] font-medium text-fg">Emerging</h3>

      <div className="mt-3">
        {loading ? (
          <EmergingSkeleton />
        ) : !runExists ? (
          <EmptyState
            size="sm"
            bounded
            icon={<TrendingUp {...iconProps} size={16} aria-hidden="true" />}
            title="No run to pool across yet"
            description="Emerging reads every rival in the cohort at one run. Once a comparison finishes, the strongest pooled pattern across its claims is named here with the claims and brands behind it."
          />
        ) : emerging === null ? (
          <EmptyState
            size="sm"
            bounded
            title="No pooled pattern in this run yet"
            description="Tagging assigns a hook type to each claim. When a hook carries claims from more than one rival, that pattern is named here with its counts."
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="type-body max-w-[52ch] text-fg-secondary">
              The {emerging.hookLabelText} hook is the pooled pattern across this
              cohort in this run.
            </p>
            <p className={cn(VALUE_CLASS, "text-[12px] text-fg-secondary")}>
              {emerging.count} {pluralize(emerging.count, "claim")} ·{" "}
              {emerging.brandCount} {pluralize(emerging.brandCount, "brand")} ·{" "}
              {emerging.sharePct}% of {emerging.taggedCount} tagged
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                label={emerging.hook}
                value={emerging.hook}
                scale="hook"
              />
              {emerging.brandNames.map((name) => (
                <span
                  key={name}
                  className="type-caption text-fg-tertiary"
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="pt-1">
              <ActionLink
                href={runHref(cohortKey)}
                icon={
                  <ArrowRight
                    {...iconProps}
                    size={16}
                    aria-hidden="true"
                    className="size-4"
                  />
                }
              >
                View evidence
              </ActionLink>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
