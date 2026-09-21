"use client";

import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EvidenceCard, sourceAccent } from "./EvidenceCard";
import { readGoogleNewsRawItem, type ClaimDoc } from "./brand-model";
import { shortDate } from "./format";

export function NewsEvidenceCard({ claim, raw }: { claim: ClaimDoc; raw: unknown }) {
  const info = readGoogleNewsRawItem(raw);
  if (info.thumbnailUrl === null) return <EvidenceCard claim={claim} />;
  return (
    <article
      className="flex min-h-[230px] flex-col overflow-hidden rounded-xl border border-border border-t-2 bg-card transition-colors hover:border-accent/50 hover:bg-accent/[0.02]"
      style={{ borderTopColor: sourceAccent.google_news }}
    >
      <div className="relative aspect-video w-full shrink-0 bg-muted">
        <img src={info.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <a
          href={claim.evidenceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="line-clamp-3 text-[13px] font-semibold leading-5 text-foreground hover:text-accent"
        >
          {claim.text}
        </a>
        <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          {info.publisherName !== null ? <span className="truncate">{info.publisherName}</span> : <span />}
          <span className="font-mono">{shortDate(claim.fetchedAt)}</span>
        </div>
        <Button asChild variant="outline" size="sm" className="h-7 w-full justify-center rounded-md text-[11px]">
          <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener">
            View <ArrowUpRight className="ml-1 size-3" />
          </a>
        </Button>
      </div>
    </article>
  );
}
