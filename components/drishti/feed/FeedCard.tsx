"use client";

import { Chip } from "@/components/drishti";
import { BrandMark } from "../brands/BrandMark";
import { EvidenceCard } from "../brands/EvidenceCard";
import { NewsEvidenceCard } from "../brands/NewsEvidenceCard";
import { YouTubeVideoCard } from "../brands/YouTubeVideoCard";
import type { ClaimDoc, YoutubeVideoGroup } from "../brands/brand-model";

export type FeedBrandInfo = { id: string; name: string; domain: string; isOwnBrand: boolean };

function BrandAttribution({ brand }: { brand: FeedBrandInfo }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 px-0.5">
      <BrandMark name={brand.name} domain={brand.domain} className="size-4 shrink-0 rounded-sm text-[8px]" />
      <span className="truncate text-[11px] font-medium text-fg-secondary">{brand.name}</span>
      {brand.isOwnBrand ? <Chip label="Your brand" dot={false} /> : null}
    </div>
  );
}

export function FeedCard({
  brand,
  claim,
  group,
  pageLabel,
}: {
  brand: FeedBrandInfo | undefined;
  claim?: ClaimDoc;
  group?: YoutubeVideoGroup;
  pageLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {brand ? <BrandAttribution brand={brand} /> : null}
      {group !== undefined ? (
        <YouTubeVideoCard group={group} raw={null} />
      ) : claim !== undefined && claim.sourceEngine === "google_news" ? (
        <NewsEvidenceCard claim={claim} raw={undefined} pageLabel={pageLabel} />
      ) : claim !== undefined ? (
        <EvidenceCard claim={claim} pageLabel={pageLabel} />
      ) : null}
    </div>
  );
}
