"use client";


import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { LABEL_CLASS, VALUE_CLASS, iconProps } from "../tokens";
import { FreshnessStamp } from "../cohorts/FreshnessStamp";
import {
  profileStatusLabel,
  profileStatusTone,
  type BrandDoc,
} from "../cohorts/cohorts-model";

export type BrandHeaderProps = {
  brand: BrandDoc;
  latestAt?: string | null;
  latestStatus?: string | null;
  className?: string;
};

export function BrandHeader({
  brand,
  latestAt = null,
  latestStatus = null,
  className,
}: BrandHeaderProps) {
  const aliases = brand.aliases.filter((alias) => alias.trim() !== "");
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      <Link
        href="/brands"
        className="inline-flex w-fit items-center gap-1.5 rounded-[3px] text-[13px] text-[var(--text-secondary,#9797a3)] hover:text-[var(--text-primary,#eeeef2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)]"
      >
        <ArrowLeft {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
        All brands
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h1 className="type-title text-[var(--text-primary,#eeeef2)]">
            {brand.name}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className={cn(VALUE_CLASS, "text-[12.5px] text-[var(--text-secondary,#9797a3)]")}>
              {brand.domain}
            </span>
            <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
              {brand.vertical}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip
            label={profileStatusLabel(brand.profileStatus)}
            tone={profileStatusTone(brand.profileStatus)}
          />
          <FreshnessStamp
            at={latestAt ?? brand.lastRefreshedAt}
            {...(latestStatus !== null
              ? { status: latestStatus, caption: "latest run" }
              : { caption: "last refreshed" })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
          aliases
        </span>
        {aliases.length === 0 ? (
          <span className="text-[13px] text-[var(--text-tertiary,#64646f)]">
            none recorded
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            {aliases.map((alias) => (
              <Chip key={alias} label={alias} dot={false} />
            ))}
          </span>
        )}
      </div>
    </header>
  );
}
