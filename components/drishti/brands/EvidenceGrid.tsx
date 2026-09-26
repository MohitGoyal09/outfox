"use client";

import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../EmptyState";
import { iconProps } from "../tokens";
import {
  groupYoutubeVideoClaims,
  findGoogleNewsRawItem,
  findGoogleOrganicRawItem,
  findYoutubeRawVideo,
  interleaveByEngine,
  readGoogleOrganicRawItem,
  readYoutubeRawVideo,
  type ClaimDoc,
  type SnapshotDoc,
} from "./brand-model";
import { EvidenceCard } from "./EvidenceCard";
import { NewsEvidenceCard } from "./NewsEvidenceCard";
import { YouTubeVideoCard } from "./YouTubeVideoCard";
import { SORT_LABEL, type FilterOption, type SortValue } from "./filters/filters-model";

const PAGE_SIZE = 24;

type EvidenceGridCard =
  | { kind: "video"; sortAt: string; group: ReturnType<typeof groupYoutubeVideoClaims>[number] }
  | { kind: "claim"; sortAt: string; claim: ClaimDoc };

function latestFetchedAt(claims: ClaimDoc[]): string {
  return claims.reduce((latest, claim) => (claim.fetchedAt > latest ? claim.fetchedAt : latest), "");
}

function buildCards(claims: ClaimDoc[]): EvidenceGridCard[] {
  const videoGroups = groupYoutubeVideoClaims(claims);
  const nonVideoClaims = claims.filter((claim) => claim.sourceEngine !== "youtube_video");
  return [
    ...videoGroups.map((group) => ({ kind: "video" as const, sortAt: latestFetchedAt(group.claims), group })),
    ...nonVideoClaims.map((claim) => ({ kind: "claim" as const, sortAt: claim.fetchedAt, claim })),
  ];
}

function cardRank(card: EvidenceGridCard): number | null {
  return card.kind === "claim" && card.claim.metric === "google_organic_result" && card.claim.unit === "rank" && typeof card.claim.value === "number"
    ? card.claim.value
    : null;
}

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function cardEngine(card: EvidenceGridCard): string {
  return card.kind === "video" ? "youtube_video" : card.claim.sourceEngine;
}

function sortCards(cards: EvidenceGridCard[], sort: SortValue): EvidenceGridCard[] {
  const sorted = [...cards];
  if (sort === "oldest") return sorted.sort((a, b) => (a.sortAt < b.sortAt ? -1 : 1));
  if (sort === "confidence") {
    return sorted.sort((a, b) => {
      const aRank = a.kind === "claim" ? (CONFIDENCE_RANK[a.claim.confidence ?? ""] ?? 0) : 0;
      const bRank = b.kind === "claim" ? (CONFIDENCE_RANK[b.claim.confidence ?? ""] ?? 0) : 0;
      return bRank - aRank || (a.sortAt < b.sortAt ? 1 : -1);
    });
  }
  if (sort === "highest_rank") {
    return sorted.sort((a, b) => {
      const aRank = cardRank(a) ?? Number.POSITIVE_INFINITY;
      const bRank = cardRank(b) ?? Number.POSITIVE_INFINITY;
      return aRank - bRank || (a.sortAt < b.sortAt ? 1 : -1);
    });
  }
  if (sort === "most_views") {
    return sorted.sort((a, b) => {
      const aViews = a.kind === "video" ? (a.group.viewCount ?? -1) : -1;
      const bViews = b.kind === "video" ? (b.group.viewCount ?? -1) : -1;
      return bViews - aViews || (a.sortAt < b.sortAt ? 1 : -1);
    });
  }
  if (sort === "most_likes") {
    return sorted.sort((a, b) => {
      const aLikes = a.kind === "video" ? (a.group.likeCount ?? -1) : -1;
      const bLikes = b.kind === "video" ? (b.group.likeCount ?? -1) : -1;
      return bLikes - aLikes || (a.sortAt < b.sortAt ? 1 : -1);
    });
  }
  if (sort === "longest_run") {
    return sorted.sort((a, b) => {
      const aDays = a.kind === "claim" && a.claim.metric === "ads_transparency_creative" ? adRunDays(a.claim) : -1;
      const bDays = b.kind === "claim" && b.claim.metric === "ads_transparency_creative" ? adRunDays(b.claim) : -1;
      return bDays - aDays || (a.sortAt < b.sortAt ? 1 : -1);
    });
  }
  return interleaveByEngine(sorted, cardEngine, (card) => card.sortAt);
}

function adRunDays(claim: ClaimDoc): number {
  if (claim.period === undefined) return -1;
  const [first, last] = claim.period.split("..");
  if (last === undefined) return -1;
  const start = Date.parse(first);
  const end = Date.parse(last);
  return Number.isNaN(start) || Number.isNaN(end) ? -1 : Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}

export function gridSortOptionsFrom(claims: ClaimDoc[]): FilterOption[] {
  const cards = buildCards(claims);
  const options: FilterOption[] = [
    { value: "newest", label: SORT_LABEL.newest },
    { value: "oldest", label: SORT_LABEL.oldest },
  ];
  if (cards.some((card) => card.kind === "claim" && card.claim.confidence !== undefined)) {
    options.push({ value: "confidence", label: SORT_LABEL.confidence });
  }
  if (cards.some((card) => cardRank(card) !== null)) {
    options.push({ value: "highest_rank", label: SORT_LABEL.highest_rank });
  }
  if (cards.some((card) => card.kind === "video" && card.group.viewCount !== null)) {
    options.push({ value: "most_views", label: SORT_LABEL.most_views });
  }
  if (cards.some((card) => card.kind === "video" && card.group.likeCount !== null)) {
    options.push({ value: "most_likes", label: SORT_LABEL.most_likes });
  }
  if (cards.some((card) => card.kind === "claim" && card.claim.metric === "ads_transparency_creative" && adRunDays(card.claim) >= 0)) {
    options.push({ value: "longest_run", label: SORT_LABEL.longest_run });
  }
  return options;
}

export function EvidenceGrid({
  claims,
  youtubeSnapshot,
  newsSnapshot,
  googleSnapshot,
  sort,
  emptyMessage,
  pageLabel,
}: {
  claims: ClaimDoc[];
  youtubeSnapshot?: SnapshotDoc;
  newsSnapshot?: SnapshotDoc;
  googleSnapshot?: SnapshotDoc;
  sort: SortValue;
  emptyMessage: string;
  pageLabel?: string;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const cards = useMemo(() => sortCards(buildCards(claims), sort), [claims, sort]);

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
        {cards.slice(0, limit).map((card) =>
          card.kind === "video" ? (
            <YouTubeVideoCard
              key={card.group.evidenceUrl}
              group={card.group}
              raw={readYoutubeRawVideo(findYoutubeRawVideo(youtubeSnapshot?.rawResponse, card.group.videoId))}
            />
          ) : card.claim.sourceEngine === "google_news" ? (
            <NewsEvidenceCard
              key={String(card.claim._id)}
              claim={card.claim}
              raw={findGoogleNewsRawItem(newsSnapshot?.rawResponse, card.claim.evidenceUrl)}
              pageLabel={pageLabel}
            />
          ) : card.claim.sourceEngine === "google" ? (
            <EvidenceCard
              key={String(card.claim._id)}
              claim={card.claim}
              raw={readGoogleOrganicRawItem(findGoogleOrganicRawItem(googleSnapshot?.rawResponse, card.claim.evidenceUrl))}
              pageLabel={pageLabel}
            />
          ) : (
            <EvidenceCard key={String(card.claim._id)} claim={card.claim} pageLabel={pageLabel} />
          ),
        )}
      </div>
      {cards.length > limit ? (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
            Load more
          </Button>
        </div>
      ) : null}
    </>
  );
}
