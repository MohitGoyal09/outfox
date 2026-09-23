"use client";

import { useState } from "react";
import { ArrowUpRight, Bookmark, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EngineTag, PlatformLogo } from "./PlatformLogo";
import { adCreativeWindow, engineLabel, hostnameOf, type ClaimDoc, type GoogleOrganicRawItem } from "./brand-model";
import { displayClaimText, periodWindow, shortDate } from "./format";

export const sourceAccent: Record<string, string> = {
  google: "#0f766e",
  google_ads_transparency_center: "#d97706",
  youtube: "#dc2626",
  youtube_video: "#dc2626",
  google_trends: "#2563eb",
  google_news: "#7c3aed",
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

export function EvidenceCard({ claim, raw }: { claim: ClaimDoc; raw?: GoogleOrganicRawItem | null }) {
  const source = engineLabel(claim.sourceEngine).replace(" Search", "");
  const accent = sourceAccent[claim.sourceEngine] ?? "#0f766e";
  const lane = LANE_STYLE[claim.sourceEngine] ?? LANE_STYLE.google;
  const cardBg = claim.sourceEngine === "google_trends" ? "bg-blue-50/40" : "bg-card";
  const rank = organicRank(claim);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const favicon = faviconFailed ? null : (raw?.faviconUrl ?? null);
  const isAdsCreative = claim.metric === "ads_transparency_creative";
  const adWindow = isAdsCreative ? adCreativeWindow(claim) : null;
  const runWindowLabel = isAdsCreative ? periodWindow(claim.period) : null;
  const trendPeriodLabel = lane.largeStat ? periodWindow(claim.period) : null;
  return (
    <article
      className={cn(
        "group flex flex-col rounded-xl border border-border p-4 transition-colors hover:border-accent/50 hover:bg-accent/[0.02]",
        cardBg,
        lane.topBorder && "border-t-2",
      )}
      style={lane.topBorder ? { borderTopColor: accent } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="relative grid size-8 shrink-0 place-items-center rounded-full border border-border text-[11px] font-semibold"
            style={{ color: accent, backgroundColor: `${accent}1a` }}
          >
            {/* Low-alpha tint of the engine's own accent (via the hex+alpha
                suffix above) — one step past a flat neutral chip, short of
                a colored border or glow either of which DESIGN.md bans. */}
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
            <p className="mt-0.5 text-[11px] text-muted-foreground">{shortDate(claim.fetchedAt)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <EngineTag engine={claim.sourceEngine} />
          <div className="flex items-center gap-1 text-muted-foreground">
            <button type="button" aria-label="Save evidence" className="rounded-md p-1 hover:bg-muted"><Bookmark className="size-3.5" /></button>
            <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener" aria-label="Open evidence" className="rounded-md p-1 hover:bg-muted"><ExternalLink className="size-3.5" /></a>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener" className={cn("line-clamp-3 text-[15px] font-semibold leading-5 text-foreground hover:text-accent", lane.titleClass)}>{displayClaimText(claim.text)}</a>
        {raw?.snippet ? <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{raw.snippet}</p> : null}
        {lane.largeStat && claim.value !== undefined ? (
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums text-foreground">{String(claim.value)}</span>
            <span className="text-[10px] text-muted-foreground">relative interest{claim.unit ? ` (${claim.unit})` : ""}</span>
            {trendPeriodLabel ? <span className="w-full font-mono text-[10px] tabular-nums text-muted-foreground">{trendPeriodLabel}</span> : null}
          </div>
        ) : adWindow ? (
          <div className="mt-2 flex flex-col gap-1">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-foreground">{adWindow.format} creative</span>
            {runWindowLabel ? <span className="font-mono text-[11px] tabular-nums text-muted-foreground">Ran {runWindowLabel}</span> : null}
          </div>
        ) : claim.metric ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">{claim.metric}{claim.value !== undefined ? ` · ${String(claim.value)}${claim.unit ? ` ${claim.unit}` : ""}` : ""}</p>
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3">
        <Badge variant="outline" className="h-6 max-w-[125px] truncate rounded-full px-2 text-[10px] text-muted-foreground">{claim.hookType?.replaceAll("_", " ") ?? "Signal"}</Badge>
        <Badge variant="outline" className="h-6 rounded-full border-emerald-200 bg-emerald-50 px-2 text-[10px] text-emerald-700"><span className="mr-1 size-1.5 rounded-full bg-emerald-500" />{claim.confidence ?? "Stored"}</Badge>
        <Button asChild variant="outline" size="sm" className="ml-auto h-7 rounded-md px-2 text-[11px]"><a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener">View <ArrowUpRight className="ml-1 size-3" /></a></Button>
      </div>
    </article>
  );
}
