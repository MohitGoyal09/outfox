"use client";

import { useMemo } from "react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { BadgeDollarSign, Clapperboard, Newspaper, Store } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MetricInfo } from "../../MetricInfo";
import { Panel } from "../../Panel";
import { categoricalColor } from "../../tokens";
import {
  adCreativeClaims,
  adRuntimeLeaderboard,
  descriptionLinkCatalogRows,
  newsPublisherRanking,
  organicRankBuckets,
  productListingClaims,
  shoppingResultCatalogRows,
  tagsForClaim,
  youtubeAdResultClaims,
  youtubeDescriptionLinkClaims,
  youtubeShoppingResultClaims,
  youtubeShortResultClaims,
  type AdRuntimeRow,
  type ClaimDoc,
  type EvidenceCatalogRow,
} from "../brand-model";
import { CountListPanel } from "../CountListPanel";
import { DestinationsPanel, destinationRows } from "../DestinationsPanel";
import { EvidenceCatalogPanel } from "../EvidenceCatalogPanel";
import { EvidenceLink } from "../EvidenceLink";
import { NotFoundInCheck } from "../NotFoundInCheck";
import { matchesBrandFilters, type BrandFilters } from "../filters/filters-model";
import { isGarbledDescriptionLinkAnchor, isVideoTimestampAnchor, parseListingVendor, shortDate } from "../format";
import { PlatformLogo } from "../PlatformLogo";

export function retailerVendorRanking(claims: ClaimDoc[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const claim of productListingClaims(claims)) {
    const vendor = parseListingVendor(claim.text);
    if (vendor === null) continue;
    counts.set(vendor, (counts.get(vendor) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function sanitizeDescriptionLinkRows(rows: readonly EvidenceCatalogRow[]): EvidenceCatalogRow[] {
  return rows
    .filter((row) => !isVideoTimestampAnchor(row.primary))
    .map((row) =>
      isGarbledDescriptionLinkAnchor(row.primary)
        ? { ...row, primary: row.evidenceUrl.replace(/^https?:\/\//, ""), meta: null }
        : row,
    );
}

const LAST_CHECKED_RANK = 10;

export function emptyBucketNotes(buckets: readonly { label: string; min: number; count: number }[]): { label: string; note: string }[] {
  return buckets
    .filter((bucket) => bucket.count === 0)
    .map((bucket) => ({ label: bucket.label, note: bucket.min > LAST_CHECKED_RANK ? "Not checked" : "None seen" }));
}

function OrganicRankChart({ buckets }: { buckets: ReturnType<typeof organicRankBuckets> }) {
  const reduceMotion = useReducedMotion();
  const emptyNotes = emptyBucketNotes(buckets);
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
          <ChartContainer config={chartConfig} className="h-[200px] w-full aspect-auto">
            <BarChart accessibilityLayer data={buckets} margin={{ left: -12, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 10 }} />
              <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08 }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={36} isAnimationActive={!reduceMotion}>
                {buckets.map((bucket, index) => (
                  <Cell key={bucket.label} fill={categoricalColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        {emptyNotes.length > 0 ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {emptyNotes.map((item) => `${item.label}: ${item.note}`).join(" · ")}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

export function shouldShowRunLengthTable(rows: readonly AdRuntimeRow[]): boolean {
  return rows.some((row) => row.runDays !== null);
}

function formatMixFromRuntimeRows(rows: readonly AdRuntimeRow[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.format, (counts.get(row.format) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label: label.replaceAll("_", " "), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function AdRunLengthLeaderboard({ rows }: { rows: AdRuntimeRow[] }) {
  const showTable = useMemo(() => shouldShowRunLengthTable(rows), [rows]);
  const formatMix = useMemo(() => formatMixFromRuntimeRows(rows), [rows]);
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
        {!showTable ? (
          <>
            <p className="mb-3 text-[11px] leading-4 text-muted-foreground">
              Ad run length was not available for these {rows.length} creative{rows.length === 1 ? "" : "s"}.
            </p>
            <ul className="space-y-2">
              {formatMix.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate capitalize">{row.label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{row.count}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="mb-3 text-[11px] leading-4 text-muted-foreground">
              Run length is how long we observed each creative live, our honest proxy for spend, not spend itself. A longer-running ad is one the brand kept live, nothing more.
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
                        definition="Days between the first and last time we saw the creative live. Our honest proxy for spend, not spend itself, a longer run means the brand kept it live, nothing more."
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
  const retailerRows = useMemo(() => retailerVendorRanking(filtered), [filtered]);
  const publisherRows = useMemo(() => newsPublisherRanking(filtered), [filtered]);
  const shoppingResultRows = useMemo(() => shoppingResultCatalogRows(filtered), [filtered]);
  const descriptionLinkRows = useMemo(
    () => sanitizeDescriptionLinkRows(descriptionLinkCatalogRows(filtered)),
    [filtered],
  );

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
      ...youtubeShoppingResultClaims(filtered),
      ...youtubeDescriptionLinkClaims(filtered),
    ];
  }, [filtered]);

  const rankBuckets = useMemo(() => organicRankBuckets(filtered), [filtered]);
  const hasOrganic = rankBuckets.some((bucket) => bucket.count > 0);
  const runtimeRows = useMemo(() => adRuntimeLeaderboard(filtered), [filtered]);
  const hasDestinations = useMemo(() => destinationRows(filtered).rows.length > 0, [filtered]);

  const notFound = [
    hasOrganic ? null : "Organic rank distribution",
    runtimeRows.length > 0 ? null : "Google Ads creatives",
    hasDestinations ? null : "Destination URLs",
    retailerRows.length > 0 ? null : "Retailers carrying this brand",
    publisherRows.length > 0 ? null : "News outlets",
    shoppingResultRows.length > 0 ? null : "In-video shopping results",
    descriptionLinkRows.length > 0 ? null : "Description link destinations",
  ].filter((item): item is string => item !== null);

  const countPanels = [
    adFormatRows.length > 0 ? (
      <CountListPanel
        key="formats"
        title="Ad formats"
        definition="How many captured Google Ads creatives use each format. It counts stored creatives, not impressions or how well each format performed."
        icon={<BadgeDollarSign className="size-4 text-accent" />}
        rows={adFormatRows}
        emptyTitle="No ad creatives yet."
        emptyDescription="Groups real Google Ads creatives by format once a check captures them."
      />
    ) : null,
    retailerRows.length > 0 ? (
      <CountListPanel
        key="retailers"
        title="Retailers carrying this brand"
        definition="How many product listings each named retailer contributed. It counts listings we captured, not sales or stock."
        icon={<Store className="size-4 text-accent" />}
        rows={retailerRows}
        emptyTitle="No named retailers yet."
        emptyDescription="Ranks the real retailer named in each SERP product listing, fills in once a listing names one."
      />
    ) : null,
    publisherRows.length > 0 ? (
      <CountListPanel
        key="news"
        title="News outlets"
        definition="How many news articles each publisher contributed. It counts articles we captured, not the publisher's total coverage."
        icon={<Newspaper className="size-4 text-accent" />}
        rows={publisherRows}
        emptyTitle="No publisher evidence yet."
        emptyDescription="Ranks real Google News publisher names once that data is available."
      />
    ) : null,
  ].filter((panel) => panel !== null);

  const catalogPanels = [
    shoppingResultRows.length > 0 ? (
      <EvidenceCatalogPanel
        key="shopping"
        title="In-video shopping results"
        definition="Real products the source surfaced for sale on this brand's videos, title, vendor, and price folded from the video page. Not the brand's whole catalog, and not proof of a sale: it is what the source showed."
        icon={<PlatformLogo engine="youtube_video" className="size-4" />}
        rows={shoppingResultRows}
        emptyTitle="No shopping results yet."
        emptyDescription="Lists real products the source surfaced for sale on this brand's videos, once a check captures shopping-result evidence."
        capNote="Up to 10 shopping results per video, as the source surfaced them, never the brand's full product catalog."
      />
    ) : null,
    descriptionLinkRows.length > 0 ? (
      <EvidenceCatalogPanel
        key="links"
        title="Description link destinations"
        definition="Real outbound links the brand placed in its own video descriptions, where its videos push traffic. This is a sample of those links, not the brand's full link roster."
        icon={<PlatformLogo engine="youtube_video" className="size-4" />}
        rows={descriptionLinkRows}
        emptyTitle="No description links yet."
        emptyDescription="Lists real outbound links found in this brand's video descriptions, once a check captures that evidence."
        capNote="Up to 10 description links per video, as stored by the pipeline, never the brand's full link roster."
      />
    ) : null,
  ].filter((panel) => panel !== null);

  return (
    <div className="space-y-4">
      {hasOrganic ? <OrganicRankChart buckets={rankBuckets} /> : null}
      {runtimeRows.length > 0 ? <AdRunLengthLeaderboard rows={runtimeRows} /> : null}
      {hasDestinations ? <DestinationsPanel claims={filtered} /> : null}
      {countPanels.length > 0 ? <div className={`grid gap-4 ${countPanels.length >= 3 ? "lg:grid-cols-3" : countPanels.length === 2 ? "lg:grid-cols-2" : ""}`}>{countPanels}</div> : null}
      {catalogPanels.length > 0 ? <div className={`grid gap-4 ${catalogPanels.length === 2 ? "lg:grid-cols-2" : ""}`}>{catalogPanels}</div> : null}
      {shortsCount > 0 || youtubeAdCount > 0 ? (
        <p className="font-mono text-[11px] text-muted-foreground">
          {shortsCount} YouTube Shorts result{shortsCount === 1 ? "" : "s"} · {youtubeAdCount} YouTube ad result{youtubeAdCount === 1 ? "" : "s"} stamped {shortDate(filtered[0]?.fetchedAt)}
        </p>
      ) : null}
      <NotFoundInCheck items={notFound} />
      <EvidenceLink claims={placementEvidenceClaims} />
    </div>
  );
}
