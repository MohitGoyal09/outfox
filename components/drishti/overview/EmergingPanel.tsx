"use client";

import { TrendingUp } from "lucide-react";

import { Chip, EmptyState, Skeleton, SkeletonRegion, VALUE_CLASS, iconProps } from "@/components/drishti";
import { cn } from "@/lib/utils";

import { Card } from "./Card";
import { hookName } from "../labels";
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
    <Card
      title="Emerging"
      description="The pooled hook pattern across brands with a finished check."
      icon={<TrendingUp {...iconProps} size={16} aria-hidden="true" className="size-4" />}
      className="h-full"
    >
      {loading ? (
        <EmergingSkeleton />
      ) : coveredBrandCount === 0 ? (
        <EmptyState
          size="sm"
          bounded
          icon={<TrendingUp {...iconProps} size={16} aria-hidden="true" />}
          title="No brand has a finished check yet"
          description="Emerging pools the tagged findings from every brand's own most recent finished check. Once at least one brand has one, the strongest pattern across them is named here."
        />
      ) : emerging === null ? (
        <EmptyState
          size="sm"
          bounded
          title="No pooled pattern yet"
          description="Tagging assigns a hook type to each finding. When a hook carries findings from these brands' latest checks, that pattern is named here with its counts."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="type-body max-w-[52ch] text-fg-secondary">
            {emerging.hookLabelText} is the pooled hook pattern across the{" "}
            {coveredBrandCount} {pluralize(coveredBrandCount, "brand")} with a finished check.
          </p>
          <p className={cn(VALUE_CLASS, "text-[12px] text-fg-secondary")}>
            {emerging.count} {pluralize(emerging.count, "finding")} · {emerging.sharePct}% of{" "}
            {emerging.taggedCount} tagged
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Chip label={hookName(emerging.hook)} value={emerging.hook} scale="hook" className="normal-case tracking-normal" />
            {emerging.brandNames.map((name) => (
              <span key={name} className="type-caption text-fg-tertiary">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
