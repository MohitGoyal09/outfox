"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { BadgeDollarSign, Clapperboard, Newspaper, Store, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "../../EmptyState";
import { MetricInfo } from "../../MetricInfo";
import { Panel } from "../../Panel";
import { categoricalColor, iconProps } from "../../tokens";
import {
  adCreativeClaims,
  adRuntimeLeaderboard,
  newsPublisherClaims,
  organicRankBuckets,
  productListingClaims,
  retailerListingRanking,
  tagsForClaim,
  youtubeAdResultClaims,
  youtubeShortResultClaims,
  type ClaimDoc,
} from "../brand-model";
import { DestinationsPanel } from "../DestinationsPanel";
import { EvidenceGrid } from "../EvidenceGrid";
import { evidencePageLabel, matchesBrandFilters, type BrandFilters } from "../filters/filters-model";
import { shortDate } from "../format";

function CountListPanel({
  title,
  definition,
  icon,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  definition: string;
  icon: React.ReactNode;
  rows: { label: string; count: number }[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        {icon}
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo label={title} definition={definition} />
        </h3>
      </div>
      <div className="p-4">
        {rows.length === 0 ? (
          <EmptyState size="sm" icon={icon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate">{row.label}</span>
                <span className="font-mono tabular-nums text-muted-foreground">{Intl.NumberFormat("en-US").format(row.count)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function OrganicRankChart({ claims }: { claims: ClaimDoc[] }) {
  const buckets = useMemo(() => organicRankBuckets(claims), [claims]);
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const chartConfig = { count: { label: "Organic results", color: "var(--cat-1)" } } satisfies ChartConfig;
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo
            label="Organic rank distribution"
            definition="How many Google organic results landed in each rank bucket on the page. It counts results found at each position, not search volume or clicks."
          />
        </h3>
      </div>
      <div className="p-4">
        {total === 0 ? (
          <EmptyState
            size="sm"
            icon={<TrendingUp {...iconProps} size={16} />}
            title="No organic results yet."
            description="Buckets the real rank SerpApi reported for each Google organic result — fills in after a Google Search check."
          />
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full aspect-auto">
            <BarChart accessibilityLayer data={buckets} margin={{ left: -12, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 10 }} />
              <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08 }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={36}>
                {buckets.map((bucket, index) => (
                  <Cell key={bucket.label} fill={categoricalColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </Panel>
  );
}

function AdRunLengthLeaderboard({ claims }: { claims: ClaimDoc[] }) {
  const rows = useMemo(() => adRuntimeLeaderboard(claims), [claims]);
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Clapperboard className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo
            label="Longest-running ads"
            definition="Real Ads Transparency creatives ranked by how long each was observed live. It shows which creatives the brand kept running, not budget, reach, or spend."
          />
        </h3>
        {rows.length > 0 ? (
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {rows.length} creative{rows.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        {rows.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Clapperboard {...iconProps} size={16} />}
            title="No Google Ads data for this brand."
            description="Many brands have no resolvable advertiser id, so this source genuinely returns nothing for them — this is not an error, and it fills in once a check resolves one."
          />
        ) : (
          <>
            <p className="mb-3 text-[11px] leading-4 text-muted-foreground">
              Run length is how long we observed each creative live — our honest proxy for spend, not spend itself. A longer-running ad is one the brand kept live, nothing more.
            </p>
            <div className="max-h-[420px] overflow-auto rounded-sm border border-border">
              <table className="w-full min-w-[560px] border-collapse text-xs">
                <thead className="sticky top-0 bg-bg-raised">
                  <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    <th className="py-2 pl-3 pr-2 font-normal">#</th>
                    <th className="py-2 pr-2 font-normal">Creative</th>
                    <th className="py-2 pr-2 font-normal">Format</th>
                    <th className="py-2 pr-2 font-normal">Window</th>
                    <th className="py-2 pr-3 text-right font-normal">
                      <MetricInfo
                        label="Run length"
                        definition="Days between the first and last time we saw the creative live. Our honest proxy for spend, not spend itself — a longer run means the brand kept it live, nothing more."
                        className="justify-end"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.claimId} className="border-b border-border last:border-0 hover:bg-accent/[0.03]">
                      <td className="py-2 pl-3 pr-2 font-mono text-[10px] tabular-nums text-muted-foreground">{index + 1}</td>
                      <td className="max-w-[240px] truncate py-2 pr-2 text-fg" title={row.title}>
                        <a href={row.evidenceUrl} target="_blank" rel="noreferrer noopener" className="hover:text-fg hover:underline">
                          {row.title}
                        </a>
                      </td>
                      <td className="py-2 pr-2 capitalize text-muted-foreground">{row.format.replaceAll("_", " ")}</td>
                      <td className="py-2 pr-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {row.firstShown && row.lastShown
                          ? `${shortDate(row.firstShown)} – ${shortDate(row.lastShown)}`
                          : row.firstShown
                            ? shortDate(row.firstShown)
                            : row.lastShown
                              ? shortDate(row.lastShown)
                              : "unknown"}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {row.runDays !== null ? (
                          <span className="font-mono text-[12px] font-semibold tabular-nums text-fg">{row.runDays}d</span>
                        ) : (
                          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">unknown</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

export function PlacementTab({
  latestClaims,
  tags,
  filters,
  now,
}: {
  latestClaims: ClaimDoc[];
  tags: ClaimDoc[];
  filters: BrandFilters;
  now: number;
}) {
  const filtered = useMemo(
    () => latestClaims.filter((claim) => matchesBrandFilters(claim, tagsForClaim(tags, claim), filters, now)),
    [latestClaims, tags, filters, now],
  );

  const adFormatRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const claim of adCreativeClaims(filtered)) {
      const format = typeof claim.value === "string" ? claim.value : "unknown";
      counts.set(format, (counts.get(format) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label: label.replaceAll("_", " "), count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const shortsCount = useMemo(() => youtubeShortResultClaims(filtered).length, [filtered]);
  const youtubeAdCount = useMemo(() => youtubeAdResultClaims(filtered).length, [filtered]);
  const retailerRows = useMemo(() => retailerListingRanking(filtered).map((row) => ({ label: row.hostname, count: row.count })), [filtered]);
  const publisherRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const claim of newsPublisherClaims(filtered)) {
      const label = typeof claim.value === "string" ? claim.value : claim.text;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const placementEvidenceClaims = useMemo(() => {
    const rankedOrganicClaims = filtered.filter(
      (claim) => claim.metric === "google_organic_result" && claim.unit === "rank",
    );
    return [
      ...adCreativeClaims(filtered),
      ...rankedOrganicClaims,
      ...productListingClaims(filtered),
      ...youtubeAdResultClaims(filtered),
      ...youtubeShortResultClaims(filtered),
    ];
  }, [filtered]);

  return (
    <div className="space-y-4">
      <OrganicRankChart claims={filtered} />
      <AdRunLengthLeaderboard claims={filtered} />
      <DestinationsPanel claims={filtered} />
      <div className="grid gap-4 lg:grid-cols-3">
        <CountListPanel
          title="Ad formats"
          definition="How many captured Google Ads creatives use each format. It counts stored creatives, not impressions or how well each format performed."
          icon={<BadgeDollarSign className="size-4 text-accent" />}
          rows={adFormatRows}
          emptyTitle="No ad creatives yet."
          emptyDescription="Groups real Google Ads creatives by format once a check captures them."
        />
        <CountListPanel
          title="Retailers carrying this brand"
          definition="How many product listings each retailer domain contributed. It counts listings we captured, not sales or stock."
          icon={<Store className="size-4 text-accent" />}
          rows={retailerRows}
          emptyTitle="No product listings yet."
          emptyDescription="Ranks real retailer domains from SERP product listings — fills in once that source lands."
        />
        <CountListPanel
          title="News outlets"
          definition="How many news articles each publisher contributed. It counts articles we captured, not the publisher's total coverage."
          icon={<Newspaper className="size-4 text-accent" />}
          rows={publisherRows}
          emptyTitle="No publisher evidence yet."
          emptyDescription="Ranks real Google News publisher names once that data is available."
        />
      </div>
      {shortsCount > 0 || youtubeAdCount > 0 ? (
        <p className="font-mono text-[11px] text-muted-foreground">
          {shortsCount} YouTube Shorts result{shortsCount === 1 ? "" : "s"} · {youtubeAdCount} YouTube ad result{youtubeAdCount === 1 ? "" : "s"} stamped {shortDate(filtered[0]?.fetchedAt)}
        </p>
      ) : null}
      <div>
        <h2 className="type-headline text-fg">Real placements</h2>
        <EvidenceGrid
          claims={placementEvidenceClaims}
          sort={filters.sort}
          emptyMessage="No placement evidence yet. Ad creatives, ranked organic results, product listings, and video placements will fill this in once a check captures them."
          pageLabel={evidencePageLabel("Placement tab", filters)}
        />
      </div>
    </div>
  );
}
