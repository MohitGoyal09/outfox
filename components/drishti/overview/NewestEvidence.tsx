"use client";

import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";

import { EmptyState, Skeleton, SkeletonRegion, VALUE_CLASS, iconProps } from "@/components/drishti";
import type { ClaimDoc } from "@/components/drishti/brands/brand-model";
import { OffTopicNotice } from "@/components/drishti/brands/filters/OffTopicNotice";
import { FeedCard, type FeedBrandInfo, type FeedThumbnail } from "@/components/drishti/feed/FeedCard";
import { cn } from "@/lib/utils";

import { Card } from "./Card";
import type { EvidenceFeed } from "./overview-model";

export type NewestEvidenceProps = {
  loading: boolean;
  hasBrands: boolean;
  feed: EvidenceFeed | null;
  claimsById: ReadonlyMap<string, ClaimDoc>;
  brandById: ReadonlyMap<string, FeedBrandInfo>;
  thumbnailByClaimId: ReadonlyMap<string, FeedThumbnail>;
  hiddenCount: number;
  showOffTopic: boolean;
  onToggleOffTopic: () => void;
};

function NewestEvidenceSkeleton() {
  return (
    <SkeletonRegion label="Loading the newest evidence">
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} variant="block" height={140} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function NewestEvidence({
  loading,
  hasBrands,
  feed,
  claimsById,
  brandById,
  thumbnailByClaimId,
  hiddenCount,
  showOffTopic,
  onToggleOffTopic,
}: NewestEvidenceProps) {
  const trailing = (
    <div className="flex items-center gap-3">
      {feed && feed.bounded ? (
        <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>newest {feed.items.length}</span>
      ) : null}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1 text-[12px] font-medium text-fg-secondary transition-colors duration-150 ease-out hover:text-fg hover:underline"
      >
        View all
        <ArrowRight {...iconProps} size={12} aria-hidden="true" className="size-3" />
      </Link>
    </div>
  );

  return (
    <Card
      title="Newest evidence"
      description="The freshest stored findings, each linked to its exact source."
      trailing={trailing}
      icon={<Quote {...iconProps} size={16} aria-hidden="true" className="size-4" />}
      bodyClassName="py-4"
      className="h-full"
      unframed
    >
      {!loading && hasBrands ? (
        <div className="mb-3">
          <OffTopicNotice
            hiddenCount={hiddenCount}
            subject="the brand they were found for"
            showing={showOffTopic}
            onToggle={onToggleOffTopic}
          />
        </div>
      ) : null}
      {loading ? (
        <NewestEvidenceSkeleton />
      ) : !hasBrands ? (
        <EmptyState
          size="sm"
          bounded
          icon={<Quote {...iconProps} size={16} aria-hidden="true" />}
          title="No brands to show evidence for yet"
          description="Add a tracked brand, and its newest findings appear here with the exact source they came from."
        />
      ) : feed === null || feed.total === 0 ? (
        <EmptyState
          size="sm"
          bounded
          title="No findings yet"
          description="Every finding keeps the exact text a source returned. When the first one arrives for any tracked brand, it is listed here word for word, with a working link to its source."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {feed.items.map((item) => (
            <FeedCard
              key={item.id}
              brand={brandById.get(item.brandId)}
              claim={claimsById.get(item.id)}
              thumbnail={thumbnailByClaimId.get(item.id)}
              pageLabel="Overview"
            />
          ))}
        </div>
      )}
    </Card>
  );
}
