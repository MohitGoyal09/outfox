"use client";

import { Quote } from "lucide-react";

import {
  Chip,
  EmptyState,
  Panel,
  Skeleton,
  SkeletonRegion,
  VALUE_CLASS,
  iconProps,
} from "@/components/drishti";
import { cn } from "@/lib/utils";

import { ActionLink } from "./ActionLink";
import { SectionLabel } from "./SectionLabel";
import { runHref, type ClaimFeed } from "./digest";

export type ClaimsOfTheDayProps = {
  loading: boolean;
  runExists: boolean;
  cohortKey: string;
  feed: ClaimFeed | null;
};

function ClaimsSkeleton() {
  return (
    <SkeletonRegion label="Loading claims">
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} variant="text" lines={2} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function ClaimsOfTheDay({
  loading,
  runExists,
  cohortKey,
  feed,
}: ClaimsOfTheDayProps) {
  const trailing =
    feed && feed.bounded ? (
      <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>
        {feed.items.length} of {feed.total}
      </span>
    ) : null;

  return (
    <Panel as="section" interactive={false} padded ariaLabel="Claims of the day">
      <SectionLabel trailing={trailing}>Claims of the day</SectionLabel>

      <div className="mt-4">
        {loading ? (
          <ClaimsSkeleton />
        ) : !runExists ? (
          <EmptyState
            size="sm"
            bounded
            icon={<Quote {...iconProps} size={16} aria-hidden="true" />}
            title="No claims to quote yet"
            description="Engines return claim text verbatim. After a run, the newest claims appear here with the brand and hook they carry."
          />
        ) : feed === null || feed.total === 0 ? (
          <EmptyState
            size="sm"
            bounded
            title="No claims in this run yet"
            description="Every claim stores the exact text a source returned. When the first one arrives, it is listed here word for word."
          />
        ) : (
          <>
            <ul className="flex flex-col">
              {feed.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <p className="type-body min-w-0 max-w-[68ch] text-fg [overflow-wrap:anywhere]">
                    {item.text}
                  </p>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="type-caption text-fg-secondary">
                      {item.brandName}
                    </span>
                    {item.hookType ? (
                      <Chip
                        label={item.hookType}
                        value={item.hookType}
                        scale="hook"
                      />
                    ) : (
                      <Chip
                        label="untagged"
                        value="not_applicable"
                        scale="hook"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {feed.bounded ? (
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>
                  {feed.items.length} of {feed.total} claims
                </span>
                <ActionLink href={runHref(cohortKey)}>View all</ActionLink>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Panel>
  );
}
