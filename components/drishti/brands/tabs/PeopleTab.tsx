"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { Newspaper, Trophy, Users, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "../../EmptyState";
import { iconProps } from "../../tokens";
import { RankedCatalogChart } from "../RankedCatalogChart";
import {
  audienceHintFrequency,
  creatorRowsFromGroups,
  findYoutubeRawVideo,
  groupYoutubeVideoClaims,
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
import { matchesBrandFilters, type BrandFilters } from "../filters/filters-model";

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
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <Trophy className="size-4 text-accent" />
        <CardTitle className="text-sm">Creator leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {rows.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Trophy {...iconProps} size={16} />}
            title="No real channel data stored yet."
            description="Ranks real YouTube channels by real total view count once a run captures video or search evidence with a channel name."
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
                <span className="font-mono tabular-nums text-foreground">{compactCount(row.totalViews)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function OwnedVsCreatorSplit({ claims, youtubeSnapshot, brand }: { claims: ClaimDoc[]; youtubeSnapshot?: SnapshotDoc; brand: BrandDoc }) {
  const groups = useMemo(() => groupYoutubeVideoClaims(claims), [claims]);
  const rows = useMemo(() => creatorRowsFromGroups(groups, youtubeSnapshot?.rawResponse, brand.name), [groups, youtubeSnapshot?.rawResponse, brand.name]);
  const ownedViews = rows.filter((row) => row.owned).reduce((sum, row) => sum + row.totalViews, 0);
  const creatorViews = rows.filter((row) => !row.owned).reduce((sum, row) => sum + row.totalViews, 0);
  const data = [
    { label: "Owned channel", value: ownedViews, color: "#0f766e" },
    { label: "Creator channels", value: creatorViews, color: "#7c3aed" },
  ].filter((row) => row.value > 0);
  const chartConfig = Object.fromEntries(data.map((row) => [row.label, { label: row.label, color: row.color }])) satisfies ChartConfig;

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <Users className="size-4 text-accent" />
        <CardTitle className="text-sm">Owned vs. creator views</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {data.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Users {...iconProps} size={16} />}
            title="Not enough channel data yet."
            description="Splits real view totals between the brand's own channel (matched by name) and third-party creators once video evidence with a channel name is stored."
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
        <p className="mt-3 text-[10.5px] leading-4 text-muted-foreground">&quot;Owned&quot; is a name match against the brand&apos;s own name, not a stored classification.</p>
      </CardContent>
    </Card>
  );
}

function BreakoutHits({ claims }: { claims: ClaimDoc[] }) {
  const groups = useMemo(
    () =>
      groupYoutubeVideoClaims(claims)
        .filter((group) => group.viewCount !== null)
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, 6),
    [claims],
  );
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <Video className="size-4 text-accent" />
        <CardTitle className="text-sm">Breakout hits</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {groups.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Video {...iconProps} size={16} />}
            title="No videos with a stored view count yet."
            description="Ranks the brand's real stored YouTube videos by real view count once video evidence is captured."
          />
        ) : (
          <ol className="space-y-2">
            {groups.map((group, index) => (
              <li key={group.evidenceUrl} className="grid grid-cols-[20px_1fr_auto] items-center gap-2 text-xs">
                <span className="font-mono text-[10px] text-muted-foreground">{index + 1}</span>
                <a href={group.evidenceUrl} target="_blank" rel="noreferrer noopener" className="truncate text-foreground hover:text-accent hover:underline">
                  {group.title ?? "Untitled video"}
                </a>
                <span className="font-mono tabular-nums text-muted-foreground">{compactCount(group.viewCount ?? 0)}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
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
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <Newspaper className="size-4 text-accent" />
        <CardTitle className="text-sm">Publishers talking about this brand</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {rows.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Newspaper {...iconProps} size={16} />}
            title="No publisher evidence stored yet."
            description="Ranks real Google News publisher names once that metric is stored."
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
      </CardContent>
    </Card>
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CreatorLeaderboard claims={filtered} youtubeSnapshot={youtubeSnapshot} youtubeSearchSnapshot={youtubeSearchSnapshot} brand={brand} />
        <BreakoutHits claims={filtered} />
      </div>
      <RankedCatalogChart
        title="Audience hints"
        rows={audienceHintRows}
        emptyTitle="No tagged audience hints yet."
        emptyDescription="Ranks the real audienceHint text an enrichment run assigned to stored claims, most frequent first — fills in after a tagged run."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <OwnedVsCreatorSplit claims={filtered} youtubeSnapshot={youtubeSnapshot} brand={brand} />
        <PublisherListPanel claims={filtered} />
      </div>
    </div>
  );
}
