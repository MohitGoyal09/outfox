"use client";


import { Tag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { EmptyState } from "../EmptyState";
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
    <ul aria-label="Tracked brands" className={cn("divide-y divide-border border-y border-border", className)}>
      {brands.map((brand) => (
        <li key={String(brand._id)} className="group bg-bg-raised transition-colors hover:bg-bg-raised-2">
          <Link
            href={`/brands/${brand._id}`}
            className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-[15px] font-medium text-fg">
                {brand.name}
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={cn(VALUE_CLASS, "text-[11.5px] text-fg-secondary")}>
                  {brand.domain}
                </span>
                <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>
                  {brand.vertical}
                </span>
                <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>
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
        </li>
      ))}
    </ul>
  );
}
