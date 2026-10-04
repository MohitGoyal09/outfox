"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { BadgeDollarSign, Newspaper, Store } from "lucide-react";
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
import { AdsGallery } from "../AdsGallery";
import { CountListPanel } from "../CountListPanel";
import { DestinationsPanel, destinationRows } from "../DestinationsPanel";
import { EvidenceCatalogPanel } from "../EvidenceCatalogPanel";
import { EvidenceLink } from "../EvidenceLink";
import { NotFoundInCheck } from "../NotFoundInCheck";
import { adFormatName } from "@/components/drishti/labels";
import { isYoutubeHashtagUrl, splitOwnStore } from "../panel-rules";
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

function isHiddenDescriptionLink(claim: ClaimDoc): boolean {
  return claim.metric === "youtube_description_link" && isYoutubeHashtagUrl(typeof claim.value === "string" ? claim.value : claim.evidenceUrl);
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
      const format = typeof claim.value === "string" ? claim.value.trim().toLowerCase() : "unknown";
      counts.set(format, (counts.get(format) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([format, count]) => ({ label: adFormatName(format), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [filtered]);

  const shortsCount = useMemo(() => youtubeShortResultClaims(filtered).length, [filtered]);
  const youtubeAdCount = useMemo(() => youtubeAdResultClaims(filtered).length, [filtered]);
  const brandId = latestClaims[0]?.brandId;
  const brand = useQuery(api.brands.getBrand, brandId ? { brandId } : "skip");
  const { retailers: retailerRows, ownStoreCount } = useMemo(() => {
    const ranked = retailerVendorRanking(filtered);
    return brand ? splitOwnStore(ranked, brand) : { retailers: ranked, ownStoreCount: 0 };
  }, [filtered, brand]);
  const publisherRows = useMemo(() => newsPublisherRanking(filtered), [filtered]);
  const shoppingResultRows = useMemo(() => shoppingResultCatalogRows(filtered), [filtered]);
  const descriptionLinkRows = useMemo(
    () => sanitizeDescriptionLinkRows(descriptionLinkCatalogRows(filtered.filter((claim) => !isHiddenDescriptionLink(claim)))),
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
        note={ownStoreCount > 0 ? `Own store: ${ownStoreCount} listing${ownStoreCount === 1 ? "" : "s"}` : undefined}
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
      <AdsGallery claims={filtered} />
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
