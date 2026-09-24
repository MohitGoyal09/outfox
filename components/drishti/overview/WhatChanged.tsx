"use client";

import { ArrowUpRight } from "lucide-react";

import { EmptyState, Panel, iconProps } from "@/components/drishti";

import { ActionLink } from "./ActionLink";
import { SectionLabel } from "./SectionLabel";
import { pluralize, type WhatChangedFeed } from "./overview-model";

export type WhatChangedProps = {
  feed: WhatChangedFeed | null;
};

export function WhatChanged({ feed }: WhatChangedProps) {
  if (feed === null) return null;

  return (
    <section aria-label="What changed since your last check" className="flex flex-col gap-3">
      <SectionLabel>What changed since your last check</SectionLabel>
      {feed.changes.length === 0 ? (
        <Panel as="div" interactive={false} padded>
          <EmptyState
            size="sm"
            bounded
            title="Nothing changed since your last checks"
            description={`Compared ${feed.comparableBrandCount} tracked ${pluralize(feed.comparableBrandCount, "brand")} against their previous check. No source added or dropped a finding.`}
          />
        </Panel>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-bg-inset">
          {feed.changes.map((change) => (
            <li
              key={change.brandId}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <p className="type-body max-w-[64ch] text-fg">{change.sentence}</p>
              <div className="shrink-0">
                <ActionLink
                  href={change.actionHref}
                  size="sm"
                  icon={<ArrowUpRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}
                >
                  Open brand
                </ActionLink>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
