"use client";

import { ArrowUpRight, Quote } from "lucide-react";

import { Chip, EmptyState, Skeleton, SkeletonRegion, VALUE_CLASS, iconProps } from "@/components/drishti";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { sourceColor } from "@/components/drishti/tokens";
import { cn } from "@/lib/utils";

import { Card } from "./Card";
import { hookLabel, relativeTime, type EvidenceFeed } from "./overview-model";

export type NewestEvidenceProps = {
  loading: boolean;
  hasBrands: boolean;
  feed: EvidenceFeed | null;
  nowMs: number;
};

function NewestEvidenceSkeleton() {
  return (
    <SkeletonRegion label="Loading the newest evidence">
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} variant="text" lines={2} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function NewestEvidence({ loading, hasBrands, feed, nowMs }: NewestEvidenceProps) {
  const trailing =
    feed && feed.bounded ? (
      <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>
        newest {feed.items.length}
      </span>
    ) : null;

  return (
    <Card
      title="Newest evidence"
      description="The freshest stored findings, each linked to its exact source."
      trailing={trailing}
      icon={<Quote {...iconProps} size={16} aria-hidden="true" className="size-4" />}
      bodyClassName="py-0"
      className="h-full"
    >
      {loading ? (
        <div className="py-4">
          <NewestEvidenceSkeleton />
        </div>
      ) : !hasBrands ? (
        <div className="py-4">
          <EmptyState
            size="sm"
            bounded
            icon={<Quote {...iconProps} size={16} aria-hidden="true" />}
            title="No brands to show evidence for yet"
            description="Add a tracked brand, and its newest findings appear here with the exact source they came from."
          />
        </div>
      ) : feed === null || feed.total === 0 ? (
        <div className="py-4">
          <EmptyState
            size="sm"
            bounded
            title="No findings yet"
            description="Every finding keeps the exact text a source returned. When the first one arrives for any tracked brand, it is listed here word for word, with a working link to its source."
          />
        </div>
      ) : (
        <ul className="flex flex-col">
          {feed.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0"
            >
              <p className="type-body max-w-[68ch] text-fg [overflow-wrap:anywhere]">{item.text}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className={cn(VALUE_CLASS, "text-[11px] text-fg-secondary")}>{item.brandName}</span>
                {item.isOwnBrand ? <Chip label="Your brand" dot={false} /> : null}
                <span className="inline-flex items-center gap-1.5">
                  <PlatformLogo engine={item.engine} className="size-3" />
                  <span
                    className="type-caption text-fg-tertiary underline decoration-[1.5px] underline-offset-[3px]"
                    style={{ textDecorationColor: sourceColor(item.engine) }}
                  >
                    {item.engineLabelText}
                  </span>
                </span>
                <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>
                  {relativeTime(item.fetchedAt, nowMs)}
                </span>
                {item.hookType ? <Chip label={hookLabel(item.hookType)} value={item.hookType} scale="hook" /> : null}
                <a
                  href={item.evidenceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ml-auto inline-flex items-center gap-1 rounded-sm text-[12px] text-fg-secondary transition-colors duration-150 ease-out hover:text-fg hover:underline"
                >
                  Source
                  <ArrowUpRight {...iconProps} size={12} aria-hidden="true" className="size-3" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
