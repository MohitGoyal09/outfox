"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "../Panel";
import { SaveToBoardButton } from "../boards/SaveToBoardButton";
import { EvidenceCard } from "./EvidenceCard";
import { EngineTag } from "./PlatformLogo";
import { readGoogleNewsRawItem, type ClaimDoc } from "./brand-model";
import { displayClaimText, periodWindow, shortDate } from "./format";

export function NewsEvidenceCard({
  claim,
  raw,
  pageLabel,
}: {
  claim: ClaimDoc;
  raw: unknown;
  pageLabel?: string;
}) {
  const info = readGoogleNewsRawItem(raw);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  if (info.thumbnailUrl === null || thumbnailFailed) return <EvidenceCard claim={claim} pageLabel={pageLabel} />;
  const publishedWindow = periodWindow(claim.period);
  const publishedLabel = publishedWindow !== null ? `Published ${publishedWindow}` : `Fetched ${shortDate(claim.fetchedAt)}`;
  return (
    <Panel
      as="article"
      interactive
      className="flex flex-col overflow-hidden border-t-2 border-t-[var(--text-primary)]"
    >
      <div className="relative aspect-video w-full shrink-0 bg-muted">
        <img
          src={info.thumbnailUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover"
          onError={() => setThumbnailFailed(true)}
        />
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5">
          <EngineTag engine="google_news" className="text-white" />
        </span>
        <SaveToBoardButton
          claimId={claim._id}
          variant="icon"
          className="absolute right-2 top-2 rounded-md bg-black/70 text-white hover:bg-black/80 hover:text-white"
          context={pageLabel ? { pageLabel } : undefined}
        />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <a
          href={claim.evidenceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="line-clamp-3 text-[13px] font-semibold leading-5 text-foreground hover:text-accent"
        >
          {displayClaimText(claim.text)}
        </a>
        {info.snippet !== null ? <p className="line-clamp-2 text-[11px] leading-5 text-muted-foreground">{info.snippet}</p> : null}
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          {info.publisherName !== null ? <span className="truncate font-semibold text-foreground">{info.publisherName}</span> : <span />}
          <span className="font-mono tabular-nums">{publishedLabel}</span>
        </div>
        <Button asChild variant="outline" size="sm" className="h-7 w-full justify-center rounded-md text-[11px]">
          <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener">
            View <ArrowUpRight className="ml-1 size-3" />
          </a>
        </Button>
      </div>
    </Panel>
  );
}
