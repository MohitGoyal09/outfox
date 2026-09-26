"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Layers } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../EmptyState";
import { iconProps } from "../tokens";
import type { ClaimDoc } from "../brands/brand-model";
import type { SortValue } from "../brands/filters/filters-model";
import { FeedCard, type FeedBrandInfo, type FeedThumbnail } from "./FeedCard";
import { buildFeedCards, sortFeedCards, FEED_PAGE_SIZE } from "./feed-model";

function needsThumbnail(claim: ClaimDoc): boolean {
  return claim.sourceEngine === "google" || claim.sourceEngine === "google_news";
}

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
  const visibleCards = cards.slice(0, limit);

  const thumbnailClaimIds = useMemo(
    () =>
      visibleCards.flatMap((card) => (card.kind === "claim" && needsThumbnail(card.claim) ? [card.claim._id] : [])),
    [visibleCards],
  );
  const thumbnailsQuery = useQuery(
    api.claims.feedThumbnails,
    thumbnailClaimIds.length > 0 ? { claimIds: thumbnailClaimIds } : "skip",
  );
  const thumbnailByClaimId = useMemo(() => {
    const map = new Map<string, FeedThumbnail>();
    for (const row of thumbnailsQuery ?? []) map.set(String(row.claimId), row);
    return map;
  }, [thumbnailsQuery]);

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
        {visibleCards.map((card) => (
          <FeedCard
            key={card.kind === "video" ? card.group.evidenceUrl : String(card.claim._id)}
            brand={brandById.get(card.brandId)}
            claim={card.kind === "claim" ? card.claim : undefined}
            group={card.kind === "video" ? card.group : undefined}
            thumbnail={card.kind === "claim" ? thumbnailByClaimId.get(String(card.claim._id)) : undefined}
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
