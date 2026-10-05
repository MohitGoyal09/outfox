"use client";


import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import { LABEL_CLASS, VALUE_CLASS, iconProps } from "../tokens";
import { statusLabel } from "./status-labels";
import { categoryLabel } from "./add-brand-model";
import {
  profileStatusTone,
  type BrandDoc,
} from "../cohorts/cohorts-model";

export type BrandHeaderProps = {
  brand: BrandDoc;
  className?: string;
};

export function BrandHeader({
  brand,
  className,
}: BrandHeaderProps) {
  const aliases = brand.aliases.filter((alias) => alias.trim() !== "");
  return (
    <header className={cn("flex flex-col gap-4 border-b border-border pb-5", className)}>
      <Link
        href="/brands"
        className="inline-flex w-fit items-center gap-1.5 rounded-sm text-[13px] text-fg-secondary hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
        All brands
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h1 className="type-display text-fg">
            {brand.name}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className={cn(VALUE_CLASS, "text-[12.5px] text-fg-secondary")}>
              {brand.domain}
            </span>
            <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>
              {categoryLabel(brand.vertical)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip
            label={statusLabel(brand.profileStatus)}
            tone={profileStatusTone(brand.profileStatus)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>
          aliases
        </span>
        {aliases.length === 0 ? (
          <span className="text-[13px] text-fg-tertiary">
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
