"use client";

import { useState } from "react";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "../Panel";
import { SaveToBoardButton } from "../boards/SaveToBoardButton";
import { EngineTag, PlatformLogo } from "./PlatformLogo";
import { adCreativeWindow, adFormatWord, hostnameOf, type ClaimDoc, type GoogleOrganicRawItem } from "./brand-model";
import { displayClaimText, displayValue, periodWindow } from "./format";
import { pickThumbnail } from "@/convex/lib/cardModel";
import { hookName, measureName, sourceName } from "@/components/drishti/labels";

const SOURCE_ACCENT = "var(--text-primary)";

export const sourceAccent: Record<string, string> = {
  google: SOURCE_ACCENT,
  google_ads_transparency_center: SOURCE_ACCENT,
  youtube: SOURCE_ACCENT,
  youtube_video: SOURCE_ACCENT,
  google_trends: SOURCE_ACCENT,
  google_news: SOURCE_ACCENT,
};

type LaneStyle = { topBorder: boolean; iconClass: string; titleClass: string; largeStat: boolean };

const LANE_STYLE: Record<string, LaneStyle> = {
  google: { topBorder: true, iconClass: "size-4", titleClass: "hover:underline", largeStat: false },
  google_ads_transparency_center: { topBorder: true, iconClass: "size-4", titleClass: "", largeStat: false },
  youtube: { topBorder: true, iconClass: "size-5", titleClass: "", largeStat: false },
  youtube_video: { topBorder: true, iconClass: "size-5", titleClass: "", largeStat: false },
  google_trends: { topBorder: false, iconClass: "size-4", titleClass: "", largeStat: true },
  google_news: { topBorder: true, iconClass: "size-4", titleClass: "", largeStat: false },
};

function organicRank(claim: ClaimDoc): number | null {
  return claim.metric === "google_organic_result" && claim.unit === "rank" && typeof claim.value === "number"
    ? claim.value
    : null;
}


const isPlaceholderAdText = (text: string) => /^Ad creative \(/.test(text);

function CompactAdCard({ claim, format, pageLabel }: { claim: ClaimDoc; format: string; pageLabel?: string }) {
  return (
    <Panel as="article" interactive className="flex items-center gap-2 bg-bg-raised px-3 py-2">
      <PlatformLogo engine={claim.sourceEngine} className="size-4 shrink-0" />
      <p className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
        <span className="font-semibold text-foreground">{adFormatWord(format)}</span>
        {" · "}
        <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener" className="text-foreground hover:text-accent hover:underline">
          View in Ads Transparency
        </a>
      </p>
      <SaveToBoardButton claimId={claim._id} variant="icon" context={pageLabel ? { pageLabel } : undefined} />
    </Panel>
  );
}

export function EvidenceCard({
  claim,
  raw,
  pageLabel,
}: {
  claim: ClaimDoc;
  raw?: GoogleOrganicRawItem | null;
  pageLabel?: string;
}) {
  const source = sourceName(claim.sourceEngine).replace(" Search", "");
  const accent = sourceAccent[claim.sourceEngine] ?? SOURCE_ACCENT;
  const lane = LANE_STYLE[claim.sourceEngine] ?? LANE_STYLE.google;
  const cardBg = claim.sourceEngine === "google_trends" ? "bg-bg-inset/50" : "bg-bg-raised";
  const rank = organicRank(claim);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const favicon = faviconFailed ? null : (raw?.faviconUrl ?? null);
  const isAdsCreative = claim.metric === "ads_transparency_creative";
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const videoThumbnail = !isAdsCreative && !thumbnailFailed ? pickThumbnail(claim) : null;
  const adWindow = isAdsCreative ? adCreativeWindow(claim) : null;
  const runWindowLabel = isAdsCreative ? periodWindow(claim.period) : null;
  const trendPeriodLabel = lane.largeStat ? periodWindow(claim.period) : null;
  if (isAdsCreative && !claim.image && isPlaceholderAdText(claim.text)) return <CompactAdCard claim={claim} format={adWindow?.format ?? ""} pageLabel={pageLabel} />;
  return (
    <Panel
      as="article"
      interactive
      className={cn(
        "group flex flex-col p-4",
        cardBg,
        lane.topBorder && "border-t-2 border-t-[var(--text-primary)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="relative grid size-8 shrink-0 place-items-center rounded-full border border-border bg-bg-inset text-[11px] font-semibold"
            style={{ color: accent }}
          >
            {/* Real platform mark on a neutral well. Colour never carries the
                source on its own: the mark plus the mono engine label do. */}
            {favicon !== null ? (
              <img
                src={favicon}
                alt=""
                loading="lazy"
                className="size-4 rounded-sm object-contain"
                onError={() => setFaviconFailed(true)}
              />
            ) : (
              <PlatformLogo engine={claim.sourceEngine} className={lane.iconClass} />
            )}
            {rank !== null ? (
              <span
                className="absolute -bottom-1 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full border border-background bg-accent px-1 font-mono text-[9px] font-semibold leading-none text-accent-ink"
                title={`Organic rank ${rank}`}
              >
                #{rank}
              </span>
            ) : null}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-foreground">{raw?.sourceName ?? hostnameOf(claim.evidenceUrl) ?? source}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <EngineTag engine={claim.sourceEngine} />
          <div className="flex items-center gap-1 text-muted-foreground">
            <SaveToBoardButton claimId={claim._id} variant="icon" context={pageLabel ? { pageLabel } : undefined} />
            <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener" aria-label="Open evidence" className="rounded-md p-1 hover:bg-muted"><ExternalLink className="size-3.5" /></a>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener" className={cn("line-clamp-3 text-[15px] font-semibold leading-5 text-foreground hover:text-accent", lane.titleClass)}>{isAdsCreative && isPlaceholderAdText(claim.text) ? adFormatWord(adWindow?.format ?? "") : displayClaimText(claim.text)}</a>
        {isAdsCreative && claim.image ? (
          <img src={claim.image} alt="Ad creative" loading="lazy" className="mt-2 max-h-48 w-full rounded-md border border-border object-contain" />
        ) : null}
        {videoThumbnail !== null ? (
          <img src={videoThumbnail} alt="Video thumbnail" loading="lazy" onError={() => setThumbnailFailed(true)} className="mt-2 aspect-video w-full rounded-md border border-border object-cover" />
        ) : null}
        {raw?.snippet ? <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{raw.snippet}</p> : null}
        {lane.largeStat && claim.value !== undefined ? (
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums text-foreground">{String(claim.value)}</span>
            <span className="text-[10px] text-muted-foreground">relative interest{claim.unit ? ` (${claim.unit})` : ""}</span>
            {trendPeriodLabel ? <span className="w-full font-mono text-[10px] tabular-nums text-muted-foreground">{trendPeriodLabel}</span> : null}
          </div>
        ) : adWindow ? (
          <div className="mt-2 flex flex-col gap-1">
            {runWindowLabel ? <span className="font-mono text-[11px] tabular-nums text-muted-foreground">Ran {runWindowLabel}</span> : null}
          </div>
        ) : claim.metric ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {measureName(claim.metric)}
            {claim.value !== undefined
              ? claim.unit === "rank"
                ? ` · ranked #${String(claim.value)}`
                : ` · ${displayValue(claim.value)}${claim.unit ? ` ${claim.unit}` : ""}`
              : ""}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3">
        {claim.hookType ? <Badge variant="outline" className="h-6 max-w-[125px] truncate rounded-full px-2 text-[10px] text-muted-foreground">{hookName(claim.hookType)}</Badge> : null}
        {claim.confidence ? <Badge variant="outline" className="h-6 rounded-full px-2 text-[10px] capitalize text-muted-foreground">{claim.confidence} confidence</Badge> : null}
        <Button asChild variant="outline" size="sm" className="ml-auto h-7 rounded-md px-2 text-[11px]"><a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener">View <ArrowUpRight className="ml-1 size-3" /></a></Button>
      </div>
    </Panel>
  );
}
