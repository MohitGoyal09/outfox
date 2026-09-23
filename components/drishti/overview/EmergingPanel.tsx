"use client";

import { TrendingUp } from "lucide-react";

import { Chip, EmptyState, Panel, Skeleton, SkeletonRegion, VALUE_CLASS, iconProps } from "@/components/drishti";
import { cn } from "@/lib/utils";

import { pluralize, type Emerging } from "./overview-model";

export type EmergingPanelProps = {
  loading: boolean;
  coveredBrandCount: number;
  emerging: Emerging | null;
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

export function EmergingPanel({ loading, coveredBrandCount, emerging }: EmergingPanelProps) {
  return (
    <Panel interactive={false} padded ariaLabel="Emerging">
      <h3 className="text-[13px] font-medium text-fg">Emerging</h3>

      <div className="mt-3">
        {loading ? (
          <EmergingSkeleton />
        ) : coveredBrandCount === 0 ? (
          <EmptyState
            size="sm"
            bounded
            icon={<TrendingUp {...iconProps} size={16} aria-hidden="true" />}
            title="No brand has a finished run yet"
            description="Emerging pools the tagged claims from every brand's own most recent finished run. Once at least one brand has one, the strongest pattern across them is named here."
          />
        ) : emerging === null ? (
          <EmptyState
            size="sm"
            bounded
            title="No pooled pattern yet"
            description="Tagging assigns a hook type to each claim. When a hook carries claims from these brands' latest runs, that pattern is named here with its counts."
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="type-body max-w-[52ch] text-fg-secondary">
              The {emerging.hookLabelText} hook is the pooled pattern across the{" "}
              {coveredBrandCount} {pluralize(coveredBrandCount, "brand")} with a finished run.
            </p>
            <p className={cn(VALUE_CLASS, "text-[12px] text-fg-secondary")}>
              {emerging.count} {pluralize(emerging.count, "claim")} · {emerging.sharePct}% of{" "}
              {emerging.taggedCount} tagged
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Chip label={emerging.hook} value={emerging.hook} scale="hook" />
              {emerging.brandNames.map((name) => (
                <span key={name} className="type-caption text-fg-tertiary">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
