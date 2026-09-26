"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { Newspaper, Trophy, Users, Video } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "../../EmptyState";
import { Panel } from "../../Panel";
import { categoricalColorFor, iconProps } from "../../tokens";
import { RankedCatalogChart } from "../RankedCatalogChart";
import {
  audienceHintFrequency,
  breakoutVideoRanking,
  creatorRowsFromGroups,
  findYoutubeRawVideo,
  groupYoutubeVideoClaims,
  isContentClaim,
  mergeCreatorRows,
  newsPublisherClaims,
  readYoutubeRawVideo,
  tagBearingClaims,
  tagsForClaim,
  youtubeSearchResultRows,
  type BrandDoc,
  type ClaimDoc,
  type SnapshotDoc,
} from "../brand-model";
import { EvidenceGrid } from "../EvidenceGrid";
import { YouTubeVideoCard } from "../YouTubeVideoCard";
import { evidencePageLabel, matchesBrandFilters, type BrandFilters } from "../filters/filters-model";

function resolveTaggedContentClaims(claims: ClaimDoc[], tagRows: ClaimDoc[]): ClaimDoc[] {
  const byId = new Map(claims.map((claim) => [String(claim._id), claim]));
  const resolved = new Map<string, ClaimDoc>();
  for (const tag of tagRows) {
    const target = tag.taggedClaimId !== undefined ? byId.get(String(tag.taggedClaimId)) : tag;
    if (target !== undefined && isContentClaim(target)) resolved.set(String(target._id), target);
  }
  return [...resolved.values()];
}

function compactCount(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function CreatorLeaderboard({ claims, youtubeSnapshot, youtubeSearchSnapshot, brand }: { claims: ClaimDoc[]; youtubeSnapshot?: SnapshotDoc; youtubeSearchSnapshot?: SnapshotDoc; brand: BrandDoc }) {
  const groups = useMemo(() => groupYoutubeVideoClaims(claims), [claims]);
  const rows = useMemo(() => {
    const base = creatorRowsFromGroups(groups, youtubeSnapshot?.rawResponse, brand.name);
    const searchRows = youtubeSearchResultRows(youtubeSearchSnapshot?.rawResponse);
    return mergeCreatorRows(base, searchRows, brand.name).slice(0, 8);
  }, [groups, youtubeSnapshot?.rawResponse, youtubeSearchSnapshot?.rawResponse, brand.name]);

  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Trophy className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">Creator leaderboard</h3>
      </div>
      <div className="p-4">
        {rows.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Trophy {...iconProps} size={16} />}
            title="No real channel data yet."
            description="Ranks real YouTube channels by real total view count once a check captures video or search evidence with a channel name."
          />
        ) : (
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
                <span className="rounded-full border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">{row.owned ? "owned" : "creator"}</span>
                <span className="font-mono tabular-nums text-fg">{compactCount(row.totalViews)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function OwnedVsCreatorSplit({ claims, youtubeSnapshot, brand }: { claims: ClaimDoc[]; youtubeSnapshot?: SnapshotDoc; brand: BrandDoc }) {
  const groups = useMemo(() => groupYoutubeVideoClaims(claims), [claims]);
  const rows = useMemo(() => creatorRowsFromGroups(groups, youtubeSnapshot?.rawResponse, brand.name), [groups, youtubeSnapshot?.rawResponse, brand.name]);
  const ownedViews = rows.filter((row) => row.owned).reduce((sum, row) => sum + row.totalViews, 0);
  const creatorViews = rows.filter((row) => !row.owned).reduce((sum, row) => sum + row.totalViews, 0);
  const data = [
    { label: "Owned channel", value: ownedViews, color: categoricalColorFor("Owned channel") },
    { label: "Creator channels", value: creatorViews, color: categoricalColorFor("Creator channels") },
  ].filter((row) => row.value > 0);
  const chartConfig = Object.fromEntries(data.map((row) => [row.label, { label: row.label, color: row.color }])) satisfies ChartConfig;

  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Users className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">Owned vs. creator views</h3>
      </div>
      <div className="p-4">
        {data.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Users {...iconProps} size={16} />}
            title="Not enough channel data yet."
            description="Splits real view totals between the brand's own channel (matched by name) and third-party creators once video evidence with a channel name is available."
          />
        ) : (
          <div className="grid grid-cols-[92px_1fr] items-center gap-4">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square size-[92px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
                <Pie data={data} dataKey="value" nameKey="label" innerRadius={26} outerRadius={44} strokeWidth={1}>
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
                  <span className="font-mono tabular-nums text-muted-foreground">{compactCount(row.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="mt-3 text-[10.5px] leading-4 text-muted-foreground">&quot;Owned&quot; is a name match against the brand&apos;s own name, computed here — not a category from the source data.</p>
      </div>
    </Panel>
  );
}

function BreakoutVideos({ claims, youtubeSnapshot }: { claims: ClaimDoc[]; youtubeSnapshot?: SnapshotDoc }) {
  const groups = useMemo(
    () => breakoutVideoRanking(groupYoutubeVideoClaims(claims)).slice(0, 8),
    [claims],
  );
  return (
    <section className="space-y-3">
      <div className="flex flex-row items-center gap-2">
        <Video className="size-4 text-fg" aria-hidden />
        <h3 className="type-headline text-fg">Breakout videos</h3>
        {groups.length > 0 ? <span className="ml-auto font-mono text-[11px] text-muted-foreground">ranked by views</span> : null}
      </div>
      {groups.length === 0 ? (
        <EmptyState
          bounded
          size="sm"
          icon={<Video {...iconProps} size={16} />}
          title="No YouTube videos yet."
          description="Ranks the brand's real YouTube videos by real view count, likes shown alongside where available, once video evidence is captured."
        />
      ) : (
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

function PublisherListPanel({ claims }: { claims: ClaimDoc[] }) {
  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const claim of newsPublisherClaims(claims)) {
      const label = typeof claim.value === "string" ? claim.value : claim.text;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }, [claims]);
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Newspaper className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">Publishers talking about this brand</h3>
      </div>
      <div className="p-4">
        {rows.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Newspaper {...iconProps} size={16} />}
            title="No publisher evidence yet."
            description="Ranks real Google News publisher names once that data is available."
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate">{row.label}</span>
                <span className="font-mono tabular-nums text-muted-foreground">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
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
  const audienceHintRows = useMemo(() => audienceHintFrequency(filteredTags), [filteredTags]);

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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CreatorLeaderboard claims={filtered} youtubeSnapshot={youtubeSnapshot} youtubeSearchSnapshot={youtubeSearchSnapshot} brand={brand} />
        <OwnedVsCreatorSplit claims={filtered} youtubeSnapshot={youtubeSnapshot} brand={brand} />
      </div>
      <BreakoutVideos claims={filtered} youtubeSnapshot={youtubeSnapshot} />
      <RankedCatalogChart
        title="Audience hints"
        rows={audienceHintRows}
        emptyTitle="No tagged audience hints yet."
        emptyDescription="Ranks the real audience-hint text an enrichment check assigned to findings, most frequent first — fills in after a tagged check."
      />
      <PublisherListPanel claims={filtered} />
      <div>
        <h2 className="type-headline text-fg">Real people evidence</h2>
        <EvidenceGrid
          claims={peopleEvidenceClaims}
          youtubeSnapshot={youtubeSnapshot}
          sort={filters.sort}
          emptyMessage="No creator, video, or audience-hint evidence yet. This fills in once a check captures YouTube videos or a tagged check assigns a real audience hint."
          pageLabel={evidencePageLabel("People tab", filters)}
        />
      </div>
    </div>
  );
}
