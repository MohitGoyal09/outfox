"use client";


import type { ReactNode } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { stripEmDashes } from "@/lib/noEmDash";
import { sourceName } from "@/components/drishti/labels";
import { displayClaimText } from "../brands/format";
import { PlatformLogo } from "../brands/PlatformLogo";
import { engineDomain } from "./agentChat-model";
import type { SourceView } from "./agentChat-model";

const OPEN_DELAY_MS = 250;
const CLOSE_DELAY_MS = 100;

function fetchedLabel(fetchedAt: string | undefined): string | null {
  if (fetchedAt === undefined) return null;
  const date = new Date(fetchedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function CitationPreview({ source, children }: { source: SourceView | undefined; children: ReactNode }) {
  if (source === undefined) return <>{children}</>;
  const { claimText, fetchedAt } = source;
  const host = engineDomain(source.engine, source.url);
  const hasRawId = typeof claimText === "string" && /\b[a-z]+_[a-z_]+\b/.test(claimText);
  const text = typeof claimText === "string" && claimText.trim() !== "" && !hasRawId ? stripEmDashes(displayClaimText(claimText)) : null;
  const fetched = fetchedLabel(fetchedAt);

  return (
    <HoverCard openDelay={OPEN_DELAY_MS} closeDelay={CLOSE_DELAY_MS}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-72 rounded-lg border border-border bg-bg-raised p-3 text-fg shadow-[var(--shadow-md)] ring-0"
      >
        <div className="flex items-center gap-1.5 text-[12px] font-medium">
          <PlatformLogo engine={source.engine} className="size-3.5" />
          <span>{sourceName(source.engine)}</span>
        </div>
        <div className="mt-0.5 font-mono text-[10.5px] text-fg-tertiary">
          {host}
          {fetched !== null ? ` · ${fetched}` : ""}
        </div>
        {text !== null ? <p className="mt-2 line-clamp-3 text-[12.5px] leading-snug text-fg-secondary">{text}</p> : null}
        <div className="mt-2 border-t border-border pt-2 text-[11px] text-fg-tertiary">Click to open the source</div>
      </HoverCardContent>
    </HoverCard>
  );
}
