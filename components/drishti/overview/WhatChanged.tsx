"use client";

import { ArrowRight } from "lucide-react";

import { EmptyState, iconProps } from "@/components/drishti";
import { cn } from "@/lib/utils";

import { ActionLink } from "./ActionLink";
import { Card } from "./Card";
import { pluralize, type WhatChangedFeed } from "./overview-model";

export type WhatChangedProps = {
  feed: WhatChangedFeed | null;
};

export function WhatChanged({ feed }: WhatChangedProps) {
  if (feed === null) return null;
  const move = feed.biggestMove ?? null;
  const rows = [...feed.changes].sort((a, b) => Number(a.isQuiet === true) - Number(b.isQuiet === true));

  return (
    <Card title="What changed since your last check" className="h-full">
      {move !== null ? (
        <p className="type-body mb-3 max-w-[64ch] border-b border-border pb-3 font-medium text-fg">
          {move.sentence}
        </p>
      ) : feed.comparableBrandCount === 0 ? (
        <p className="type-body text-fg-secondary">No brand has two checks to compare yet.</p>
      ) : null}
      {feed.comparableBrandCount === 0 ? null : feed.changes.length === 0 ? (
        <EmptyState
          size="sm"
          bounded
          title="Nothing changed since your last checks"
          description={`Compared ${feed.comparableBrandCount} tracked ${pluralize(feed.comparableBrandCount, "brand")} against their previous check. No source added or dropped a finding.`}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((change) => (
            <li
              key={change.brandId}
              className={cn(
                "flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                change.isOwnBrand && "border-l-2 border-l-accent pl-3",
              )}
            >
              <p className="type-body max-w-[64ch] text-fg">{change.sentence}</p>
              <div className="shrink-0">
                <ActionLink
                  href={change.actionHref}
                  size="sm"
                  icon={<ArrowRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}
                >
                  Open brand
                </ActionLink>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
