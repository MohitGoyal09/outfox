"use client";

import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../EmptyState";
import { iconProps } from "../tokens";
import type { ClaimDoc } from "../brands/brand-model";
import type { SortValue } from "../brands/filters/filters-model";
import { FeedCard, type FeedBrandInfo } from "./FeedCard";
import { buildFeedCards, sortFeedCards, FEED_PAGE_SIZE } from "./feed-model";

export function FeedGrid({
  claims,
  brandById,
  sort,
  emptyMessage,
  pageLabel,
}: {
  claims: ClaimDoc[];
  brandById: ReadonlyMap<string, FeedBrandInfo>;
  sort: SortValue;
  emptyMessage: string;
  pageLabel?: string;
}) {
  const [limit, setLimit] = useState(FEED_PAGE_SIZE);
  const cards = useMemo(() => sortFeedCards(buildFeedCards(claims), sort), [claims, sort]);

  if (cards.length === 0) {
    return (
      <EmptyState
        bounded
        icon={<Layers {...iconProps} size={16} />}
        title="No evidence to show here yet."
        description={emptyMessage}
      />
    );
  }

  return (
    <>
      <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.slice(0, limit).map((card) => (
          <FeedCard
            key={card.kind === "video" ? card.group.evidenceUrl : String(card.claim._id)}
            brand={brandById.get(card.brandId)}
            claim={card.kind === "claim" ? card.claim : undefined}
            group={card.kind === "video" ? card.group : undefined}
            pageLabel={pageLabel}
          />
        ))}
      </div>
      {cards.length > limit ? (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setLimit((current) => current + FEED_PAGE_SIZE)}>
            Load more
          </Button>
        </div>
      ) : null}
    </>
  );
}
