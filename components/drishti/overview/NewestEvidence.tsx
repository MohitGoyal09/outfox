"use client";

import { ArrowUpRight, Quote } from "lucide-react";

import { Chip, EmptyState, Panel, Skeleton, SkeletonRegion, VALUE_CLASS, iconProps } from "@/components/drishti";
import { cn } from "@/lib/utils";

import { SectionLabel } from "./SectionLabel";
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
    <Panel as="section" interactive={false} padded ariaLabel="Newest evidence">
      <SectionLabel trailing={trailing}>Newest evidence</SectionLabel>

      <div className="mt-4">
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
          <ul className="flex flex-col">
            {feed.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <p className="type-body max-w-[68ch] text-fg [overflow-wrap:anywhere]">{item.text}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={cn(VALUE_CLASS, "text-[11px] text-fg-secondary")}>{item.brandName}</span>
                  <span className="type-caption text-fg-tertiary">{item.engineLabelText}</span>
                  <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>
                    {relativeTime(item.fetchedAt, nowMs)}
                  </span>
                  {item.hookType ? <Chip label={hookLabel(item.hookType)} value={item.hookType} scale="hook" /> : null}
                  <a
                    href={item.evidenceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ml-auto inline-flex items-center gap-1 text-[12px] text-fg-secondary hover:text-fg hover:underline"
                  >
                    Source
                    <ArrowUpRight {...iconProps} size={12} aria-hidden="true" className="size-3" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
