"use client";

import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "../Panel";
import { EngineTag, PlatformLogo } from "./PlatformLogo";
import { tagBearingClaims, type YoutubeRawVideoInfo, type YoutubeVideoGroup } from "./brand-model";
import { hookName } from "@/components/drishti/labels";

function compactCount(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function YouTubeVideoCard({
  group,
  raw,
}: {
  group: YoutubeVideoGroup;
  raw: YoutubeRawVideoInfo | null;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const derivedThumbnail = group.videoId
    ? `https://i.ytimg.com/vi/${group.videoId}/hqdefault.jpg`
    : null;
  const thumbnailUrl = raw?.thumbnailUrl ?? derivedThumbnail;
  const hasThumbnail = Boolean(thumbnailUrl) && !thumbnailFailed;
  const [channelThumbFailed, setChannelThumbFailed] = useState(false);
  const tag = tagBearingClaims(group.claims)[0] ?? null;
  return (
    <Panel as="article" interactive className="flex flex-col overflow-hidden">
      <div className="relative aspect-video w-full shrink-0 bg-muted">
        {hasThumbnail ? (
          <img
            src={thumbnailUrl!}
            alt=""
            loading="lazy"
            className="size-full object-cover"
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div className="grid size-full place-items-center"><PlatformLogo engine="youtube_video" className="size-9" /></div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5">
          <EngineTag engine="youtube_video" className="text-white" />
        </span>
        {group.length !== null ? (
          <span className="absolute bottom-2 left-2 inline-flex items-center rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white tabular-nums">
            {group.length}
          </span>
        ) : null}
        {group.viewCount !== null ? (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white tabular-nums">
            <Play className="size-2.5 fill-white" />
            {compactCount(group.viewCount)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {group.title ? (
          <a href={group.evidenceUrl} target="_blank" rel="noreferrer noopener" className="line-clamp-2 text-[13px] font-semibold leading-5 text-foreground hover:text-accent">{group.title}</a>
        ) : (
          <span className="text-[13px] font-semibold text-muted-foreground">Untitled video</span>
        )}
        {raw?.channelName ? (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {raw.channelThumbnailUrl && !channelThumbFailed ? (
              <img
                src={raw.channelThumbnailUrl}
                alt=""
                className="size-4 shrink-0 rounded-full object-cover"
                onError={() => setChannelThumbFailed(true)}
              />
            ) : null}
            <span className="truncate">{raw.channelName}</span>
            {raw.subscribers !== null ? (
              <span className="font-mono tabular-nums">
                · {typeof raw.subscribers === "number" ? `${raw.subscribers.toLocaleString()} subscribers` : raw.subscribers}
              </span>
            ) : null}
          </div>
        ) : null}
        {group.publishedDate ? <p className="text-[11px] text-muted-foreground">Published {group.publishedDate}</p> : null}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {tag?.hookType ? <Badge variant="outline" className="h-6 max-w-[140px] truncate rounded-full px-2 text-[10px] text-muted-foreground">{hookName(tag.hookType)}</Badge> : null}
          {tag?.confidence ? <Badge variant="outline" className="h-6 rounded-full px-2 text-[10px] capitalize text-muted-foreground">{tag.confidence} confidence</Badge> : null}
          {group.likeCount !== null ? <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">{group.likeCount.toLocaleString()} likes</span> : null}
        </div>
        <Button asChild variant="outline" size="sm" className="mt-auto h-7 w-full justify-center rounded-md text-[11px]"><a href={group.evidenceUrl} target="_blank" rel="noreferrer noopener">View <ArrowUpRight className="ml-1 size-3" /></a></Button>
      </div>
    </Panel>
  );
}
