"use client";

import { useMemo } from "react";
import { useReducedMotion } from "motion/react";
import { Cell, Pie, PieChart } from "recharts";
import { Newspaper, Trophy, Users, Video } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MetricInfo } from "../../MetricInfo";
import { Panel } from "../../Panel";
import { categoricalColorFor } from "../../tokens";
import { CountListPanel } from "../CountListPanel";
import { EvidenceCatalogPanel } from "../EvidenceCatalogPanel";
import { RankedCatalogChart } from "../RankedCatalogChart";
import {
  audienceHintFrequency,
  breakoutVideoRanking,
  creatorRowsFromGroups,
  findYoutubeRawVideo,
  groupYoutubeVideoClaims,
  isContentClaim,
  mergeCreatorRows,
  newsPublisherRanking,
  readYoutubeRawVideo,
  relatedVideoCatalogRows,
  tagBearingClaims,
  tagsForClaim,
  youtubeSearchResultRows,
  type BrandDoc,
  type ClaimDoc,
  type SnapshotDoc,
} from "../brand-model";
import { EvidenceLink } from "../EvidenceLink";
import { NotFoundInCheck } from "../NotFoundInCheck";
import { PlatformLogo } from "../PlatformLogo";
import { YouTubeVideoCard } from "../YouTubeVideoCard";
import { matchesBrandFilters, type BrandFilters } from "../filters/filters-model";
import { compactCount } from "../format";
import { groupLabelRows } from "../panel-rules";

const RELATED_VIDEO_PREVIEW = 5;

function resolveTaggedContentClaims(claims: ClaimDoc[], tagRows: ClaimDoc[]): ClaimDoc[] {
  const byId = new Map(claims.map((claim) => [String(claim._id), claim]));
  const resolved = new Map<string, ClaimDoc>();
  for (const tag of tagRows) {
    const target = tag.taggedClaimId !== undefined ? byId.get(String(tag.taggedClaimId)) : tag;
    if (target !== undefined && isContentClaim(target)) resolved.set(String(target._id), target);
  }
  return [...resolved.values()];
}

function CreatorLeaderboard({ rows }: { rows: ReturnType<typeof mergeCreatorRows> }) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Trophy className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo
            label="Creator leaderboard"
            definition="Real YouTube channels ranked by total views across the videos we captured. Subscriber counts come from the source and may be missing; “owned” is a name match against the brand, not a source category."
          />
        </h3>
      </div>
      <div className="p-4">
          <ul className="space-y-2">
            {rows.map((row, index) => (
              <li key={row.channelName} className="grid grid-cols-[20px_1fr_auto_auto] items-center gap-2 text-xs">
                <span className="font-mono text-[10px] text-muted-foreground">{index + 1}</span>
                <span className="truncate">
                  {row.channelName}
                  {row.subscribers !== null ? (
                    <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">({compactCount(row.subscribers)} subs)</span>
                  ) : null}
                </span>
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[11px] font-medium text-fg-secondary">{row.owned ? "owned" : "creator"}</span>
                <span className="font-mono tabular-nums text-fg">{compactCount(row.totalViews)}</span>
              </li>
            ))}
          </ul>
      </div>
    </Panel>
  );
}

export const TWO_WAY_DONUT_MIN_DISTINCT = 2;

export function ownedVsCreatorData(rows: { owned: boolean; totalViews: number }[]): { label: string; value: number; color: string }[] {
  const ownedViews = rows.filter((row) => row.owned).reduce((sum, row) => sum + row.totalViews, 0);
  const creatorViews = rows.filter((row) => !row.owned).reduce((sum, row) => sum + row.totalViews, 0);
  return [
    { label: "Owned channel", value: ownedViews, color: categoricalColorFor("Owned channel") },
    { label: "Creator channels", value: creatorViews, color: categoricalColorFor("Creator channels") },
  ].filter((row) => row.value > 0);
}

export function ownedVsCreatorRenderMode(rows: { owned: boolean; totalViews: number }[]): "empty" | "single" | "donut" {
  const count = ownedVsCreatorData(rows).length;
  if (count === 0) return "empty";
  if (count < TWO_WAY_DONUT_MIN_DISTINCT) return "single";
  return "donut";
}

export function SingleSideStat({ row }: { row: { label: string; value: number; color: string } }) {
  const owned = row.label === "Owned channel";
  const context = owned
    ? "No third-party creator video is captured yet, not proof none exist."
    : "Zero owned views here is a name-match miss against the brand's own name, not proof the brand has no channel.";
  return (
    <div className="flex items-center gap-3">
      <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
      <div>
        <p className="font-mono text-2xl font-semibold leading-none tabular-nums text-foreground">{compactCount(row.value)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          All real views so far are {row.label.toLowerCase()}. {context}
        </p>
      </div>
    </div>
  );
}

function OwnedVsCreatorSplit({ data }: { data: ReturnType<typeof ownedVsCreatorData> }) {
  const reduceMotion = useReducedMotion();
  const totalViews = data.reduce((sum, row) => sum + row.value, 0);
  const chartConfig = Object.fromEntries(data.map((row) => [row.label, { label: row.label, color: row.color }])) satisfies ChartConfig;

  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Users className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo
            label="Owned vs. creator views"
            definition="Real view totals split between the brand's own channel, matched by name, and third-party creators. It is a derived split of the videos we captured, not a category from the source data."
          />
        </h3>
      </div>
      <div className="p-4">
        {data.length < TWO_WAY_DONUT_MIN_DISTINCT ? (
          <SingleSideStat row={data[0]} />
        ) : (
          <div className="grid grid-cols-[92px_1fr] items-center gap-4">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square size-[92px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={26}
                  outerRadius={44}
                  strokeWidth={1}
                  isAnimationActive={!reduceMotion}
                >
                  {data.map((row) => (
                    <Cell key={row.label} fill={row.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="space-y-2 text-[11px]">
              {data.map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
                  <span className="flex-1 truncate">{row.label}</span>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{totalViews ? `${Math.round((row.value / totalViews) * 100)}%` : "-"}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{compactCount(row.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="mt-3 text-[10.5px] leading-4 text-muted-foreground">&quot;Owned&quot; is a name match against the brand&apos;s own name, computed here, not a category from the source data.</p>
      </div>
    </Panel>
  );
}

function BreakoutVideos({ groups, youtubeSnapshot }: { groups: ReturnType<typeof breakoutVideoRanking>; youtubeSnapshot?: SnapshotDoc }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-row items-center gap-2">
        <Video className="size-4 text-fg" aria-hidden />
        <h3 className="type-headline text-fg">
          <MetricInfo
            label="Breakout videos"
            definition="The brand's stored YouTube videos ranked by real view count, highest first. Likes are shown beside views so a gap is visible; we never compute an outlier score."
          />
        </h3>
        <MetricInfo
          label="ranked by views"
          definition="Order is the real stored view count, highest first. A video with no stored view count sorts last and is never treated as zero."
          className="ml-auto font-mono text-[11px] text-muted-foreground"
        />
      </div>
      {(
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group, index) => {
            const raw = readYoutubeRawVideo(findYoutubeRawVideo(youtubeSnapshot?.rawResponse, group.videoId));
            return (
              <div key={group.evidenceUrl} className="relative">
                <span className="absolute -left-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full border border-border-strong bg-bg-raised font-mono text-[10px] font-semibold tabular-nums text-fg">
                  {index + 1}
                </span>
                <YouTubeVideoCard group={group} raw={raw} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function PeopleTab({
  brand,
  latestClaims,
  tags,
  filters,
  now,
  youtubeSnapshot,
  youtubeSearchSnapshot,
}: {
  brand: BrandDoc;
  latestClaims: ClaimDoc[];
  tags: ClaimDoc[];
  filters: BrandFilters;
  now: number;
  youtubeSnapshot?: SnapshotDoc;
  youtubeSearchSnapshot?: SnapshotDoc;
}) {
  const filtered = useMemo(
    () => latestClaims.filter((claim) => matchesBrandFilters(claim, tagsForClaim(tags, claim), filters, now)),
    [latestClaims, tags, filters, now],
  );
  const filteredTags = useMemo(() => tagBearingClaims(filtered), [filtered]);
  const audienceHintRows = useMemo(() => groupLabelRows(audienceHintFrequency(filteredTags)), [filteredTags]);
  const relatedVideoRows = useMemo(() => relatedVideoCatalogRows(filtered), [filtered]);
  const publisherRows = useMemo(() => newsPublisherRanking(filtered), [filtered]);

  const peopleVideoClaims = useMemo(() => filtered.filter((claim) => claim.sourceEngine === "youtube_video"), [filtered]);
  const peopleAudienceHintClaims = useMemo(() => {
    const audienceHintTagRows = filteredTags.filter((tag) => tag.audienceHint !== undefined && tag.audienceHint.trim() !== "");
    return resolveTaggedContentClaims(filtered, audienceHintTagRows);
  }, [filtered, filteredTags]);
  const peopleEvidenceClaims = useMemo(() => {
    const merged = new Map<string, ClaimDoc>();
    for (const claim of [...peopleVideoClaims, ...peopleAudienceHintClaims]) merged.set(String(claim._id), claim);
    return [...merged.values()];
  }, [peopleVideoClaims, peopleAudienceHintClaims]);

  const videoGroups = useMemo(() => groupYoutubeVideoClaims(filtered), [filtered]);
  const baseCreatorRows = useMemo(
    () => creatorRowsFromGroups(videoGroups, youtubeSnapshot?.rawResponse, brand.name),
    [videoGroups, youtubeSnapshot?.rawResponse, brand.name],
  );
  const creatorRows = useMemo(() => {
    const searchRows = youtubeSearchResultRows(youtubeSearchSnapshot?.rawResponse);
    return mergeCreatorRows(baseCreatorRows, searchRows, brand.name).slice(0, 8);
  }, [baseCreatorRows, youtubeSearchSnapshot?.rawResponse, brand.name]);
  const splitData = useMemo(() => ownedVsCreatorData(baseCreatorRows), [baseCreatorRows]);
  const breakoutGroups = useMemo(() => breakoutVideoRanking(videoGroups).slice(0, 8), [videoGroups]);

  const notFound = [
    creatorRows.length === 0 ? "Creator leaderboard" : null,
    splitData.length === 0 ? "Owned vs. creator views" : null,
    breakoutGroups.length === 0 ? "YouTube videos" : null,
    relatedVideoRows.length === 0 ? "Related videos" : null,
    audienceHintRows.length === 0 ? "Audience hints" : null,
    publisherRows.length === 0 ? "Publishers talking about this brand" : null,
  ].filter((item): item is string => item !== null);

  return (
    <div className="space-y-4">
      {creatorRows.length > 0 || splitData.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {creatorRows.length > 0 ? <CreatorLeaderboard rows={creatorRows} /> : null}
          {splitData.length > 0 ? <OwnedVsCreatorSplit data={splitData} /> : null}
        </div>
      ) : null}
      {breakoutGroups.length > 0 ? <BreakoutVideos groups={breakoutGroups} youtubeSnapshot={youtubeSnapshot} /> : null}
      {relatedVideoRows.length > 0 ? (
        <EvidenceCatalogPanel
          title="Related videos"
          definition="Other channels' videos YouTube surfaces as related to this brand's own videos, a free creator-and-competitor discovery graph: who else YouTube associates with this brand, not a ranked or complete list."
          icon={<PlatformLogo engine="youtube_video" className="size-4" />}
          rows={relatedVideoRows}
          emptyTitle="No related videos yet."
          emptyDescription="Lists other channels' videos YouTube associates with this brand's own videos, once a check captures YouTube video detail evidence."
          capNote="Up to 10 related videos per video we checked, as YouTube itself surfaced them, never the brand's full competitive graph."
          previewCount={RELATED_VIDEO_PREVIEW}
        />
      ) : null}
      {audienceHintRows.length > 0 ? (
        <RankedCatalogChart
          title="Audience hints"
          definition="How often an enrichment check assigned each audience hint to a finding. The tag is free text, so two rows can mean the same audience in different words."
          rows={audienceHintRows}
          colorFor={() => "var(--text-secondary)"}
          emptyTitle="No tagged audience hints yet."
          emptyDescription="Fills in after a tagged check."
        />
      ) : null}
      {publisherRows.length > 0 ? (
        <CountListPanel
          title="Publishers talking about this brand"
          definition="How many real news articles each publisher contributed. It counts articles we captured, not the publisher's total coverage of the brand."
          icon={<Newspaper className="size-4 text-fg" aria-hidden />}
          rows={publisherRows}
          emptyTitle="No publisher evidence yet."
          emptyDescription="Ranks real Google News publisher names once that data is available."
        />
      ) : null}
      <NotFoundInCheck items={notFound} />
      <EvidenceLink claims={peopleEvidenceClaims} />
    </div>
  );
}
