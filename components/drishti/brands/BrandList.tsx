"use client";


import { Tag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { SkeletonRows } from "../Skeleton";
import { LABEL_CLASS, VALUE_CLASS, iconProps } from "../tokens";
import { FreshnessStamp } from "../cohorts/FreshnessStamp";
import {
  formatStamp,
  profileStatusLabel,
  profileStatusTone,
  type BrandDoc,
} from "../cohorts/cohorts-model";

export type BrandListProps = {
  brands: BrandDoc[];
  isLoading?: boolean;
  emptyAction?: React.ReactNode;
  className?: string;
};

export function BrandList({
  brands,
  isLoading = false,
  emptyAction,
  className,
}: BrandListProps) {
  if (isLoading) {
    return <SkeletonRows count={5} variant="block" height={64} className={className} />;
  }

  if (brands.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          bounded
          icon={<Tag {...iconProps} size={16} />}
          title="No brands tracked yet."
          description="A brand is a rival you compare against. Track one below and it becomes available to every cohort."
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <ul aria-label="Tracked brands" className={cn("flex flex-col gap-3", className)}>
      {brands.map((brand) => (
        <Panel as="li" key={String(brand._id)} padded>
          <Link
            href={`/brands/${brand._id}`}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)]"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-[15px] font-medium text-[var(--text-primary,#eeeef2)]">
                {brand.name}
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={cn(VALUE_CLASS, "text-[11.5px] text-[var(--text-secondary,#9797a3)]")}>
                  {brand.domain}
                </span>
                <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
                  {brand.vertical}
                </span>
                <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary,#64646f)]")}>
                  added {formatStamp(brand.createdAt)}
                </span>
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Chip
                label={profileStatusLabel(brand.profileStatus)}
                tone={profileStatusTone(brand.profileStatus)}
              />
              <FreshnessStamp
                at={brand.lastRefreshedAt}
                caption="last refreshed"
              />
            </span>
          </Link>
        </Panel>
      ))}
    </ul>
  );
}
