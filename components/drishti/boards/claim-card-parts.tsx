"use client";


import { useState } from "react";
import { cn } from "@/lib/utils";
import { adRunText } from "@/convex/lib/cardModel";
import { isBrokenAdPreview } from "../brands/ad-preview";
import { BrandMark } from "../brands/BrandMark";
import { adFormatName, hookName, stageName } from "../labels";
import { hookDotColor } from "../tokens";
import type { FlowClaim } from "./canvas-flow";

export function CardBrand({ claim }: { claim: FlowClaim }) {
  if (!claim.brandName) return null;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {claim.brandDomain ? <BrandMark name={claim.brandName} domain={claim.brandDomain} className="size-4 text-[9px]" /> : null}
      <span className="truncate text-[12px] font-semibold text-fg">{claim.brandName}</span>
    </span>
  );
}

export function CardThumb({ claim, className }: { claim: FlowClaim; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!claim.thumbnailUrl || failed) return null;
  return (
    <img
      src={claim.thumbnailUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      onLoad={(e) => {
        if (isBrokenAdPreview(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)) setFailed(true);
      }}
      className={cn("w-full rounded-md border border-border bg-bg-inset object-cover", className)}
    />
  );
}

const TAGS_WRAP_CHARS = 30;

export function tagsMayWrap(claim: FlowClaim): boolean {
  if (!claim.tagHook || !claim.tagStage) return false;
  return hookName(claim.tagHook).length + stageName(claim.tagStage).length > TAGS_WRAP_CHARS;
}

const CHIP = "inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full border border-border px-1.5 py-px text-[11px] leading-4 text-fg-secondary";

export function CardTags({ claim }: { claim: FlowClaim }) {
  return (
    <>
      {claim.tagHook ? (
        <span className={CHIP}>
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: hookDotColor(claim.tagHook) }} />
          {hookName(claim.tagHook)}
        </span>
      ) : null}
      {claim.tagStage ? <span className={CHIP}>{stageName(claim.tagStage)}</span> : null}
    </>
  );
}

export function adLine(claim: FlowClaim): string | null {
  if (!claim.adFormat) return null;
  return [adFormatName(claim.adFormat), adRunText(claim.adRunDays)].filter(Boolean).join(" · ");
}
