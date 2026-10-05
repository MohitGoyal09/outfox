"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, BarChart3, Globe2, Link2, Tag } from "lucide-react";

import type { Id } from "@/convex/_generated/dataModel";
import { Chip } from "../Chip";
import { PillButton, pillClasses } from "../PillButton";
import { profileStatusTone, type BrandDoc } from "../cohorts/cohorts-model";
import { BrandMark } from "./BrandMark";
import { OwnBrandToggle } from "./OwnBrandToggle";
import { SimilarBrandsPanel } from "./SimilarBrandsPanel";
import { categoryLabel } from "./add-brand-model";
import { shortDate } from "./format";
import { statusLabel } from "./status-labels";

const fmt = Intl.NumberFormat("en-US");
const statClass = "inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-bg-raised px-2.5 text-[13px] text-fg-secondary";

function ShareButton() {
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  }
  return (
    <PillButton variant="outline" size="sm" title="Copy link to this page" onClick={() => void copyLink()}>
      <Link2 className="size-3.5" aria-hidden />
      {copied ? "Copied" : "Copy link"}
    </PillButton>
  );
}

export function BrandHeader({
  brand,
  brandId,
  latestRunId,
  latestAt,
  findingsCount,
  taggedCount,
}: {
  brand: BrandDoc;
  brandId: Id<"brands">;
  latestRunId: string | null;
  latestAt: string | null;
  findingsCount: number;
  taggedCount: number;
}) {
  const isOwn = brand.isOwnBrand === true;
  return (
    <header className="flex flex-col gap-4 pb-6">
      <Link href="/brands" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-fg-secondary hover:text-fg">
        <ArrowLeft className="size-3.5" aria-hidden />
        All brands
      </Link>
      <div className="rounded-2xl border border-border bg-bg-raised p-5 shadow-[0_1px_2px_rgb(17_17_19/0.04)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <BrandMark name={brand.name} domain={brand.domain} className="size-14 shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-[28px] font-semibold leading-tight tracking-[-0.02em] text-fg">{brand.name}</h1>
                <Chip variant="status" tone={profileStatusTone(brand.profileStatus)}>
                  {statusLabel(brand.profileStatus)}
                </Chip>
                {isOwn ? <Chip variant="you">Your brand</Chip> : null}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-secondary">
                <span>{categoryLabel(brand.vertical)}</span>
                <span aria-hidden className="text-fg-tertiary">·</span>
                <span className="inline-flex items-center gap-1">
                  <Globe2 className="size-3.5" aria-hidden />
                  {brand.domain}
                </span>
                <span aria-hidden className="text-fg-tertiary">·</span>
                <span>Last check {shortDate(latestAt ?? brand.lastRefreshedAt)}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OwnBrandToggle brandId={brandId} isOwn={isOwn} size="sm" className={pillClasses("outline", "sm")} />
            <ShareButton />
            {latestRunId ? (
              <Link href={`/runs/${latestRunId}`} className={pillClasses("ink", "sm")}>
                Latest check
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={statClass}>
            <BarChart3 className="size-3.5" aria-hidden />
            <span className="font-medium text-fg">{fmt.format(findingsCount)}</span> findings
          </span>
          <span className={statClass}>
            <Tag className="size-3.5" aria-hidden />
            {taggedCount > 0 ? (
              <>
                <span className="font-medium text-fg">{fmt.format(taggedCount)}</span> tagged finding{taggedCount === 1 ? "" : "s"}
              </>
            ) : (
              "Not tagged"
            )}
          </span>
          <SimilarBrandsPanel brandId={brandId} />
        </div>
      </div>
    </header>
  );
}
