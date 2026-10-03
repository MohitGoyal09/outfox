"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Layers, Sparkles, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "../../EmptyState";
import { MetricInfo } from "../../MetricInfo";
import { Panel } from "../../Panel";
import { iconProps, HOOK_COLOR, type HookType } from "../../tokens";
import { hookName, humanize } from "@/components/drishti/labels";
import { RankedCatalogChart } from "../RankedCatalogChart";
import {
  aiOverviewClaims,
  hookMixDrift,
  hookTypeFrequency,
  pricePoints,
  tagBearingClaims,
  tagsForClaim,
  themeFrequency,
  valuePropFrequency,
  type BrandDoc,
  type ClaimDoc,
} from "../brand-model";
import { matchesBrandFilters, type BrandFilters } from "../filters/filters-model";
import { displayClaimText, shortDate } from "../format";

const PLACEHOLDER_TAG_VALUES = new Set(["unspecified", "none", "n/a", "unknown", ""]);
export function isPlaceholderTagValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "" || PLACEHOLDER_TAG_VALUES.has(normalized) || normalized.startsWith("unspecified");
}

function AiOverviewPanel({ claims }: { claims: ClaimDoc[] }) {
  const blocks = aiOverviewClaims(claims);
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">Google AI Overview</h3>
        <Badge variant="outline" className="ml-auto h-5 rounded-full px-2 text-[10px] font-normal text-muted-foreground">Google&apos;s synthesis, not ours</Badge>
      </div>
      <div className="p-4">
        <p className="mb-3 text-[11px] leading-5 text-muted-foreground">
          Google&apos;s own generated summary of this brand, not a primary source and not Drishti&apos;s analysis. Every line below links to the page Google actually cited.
        </p>
        {blocks.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Sparkles {...iconProps} size={16} />}
            title="No AI Overview yet."
            description="Fills in once a check captures Google's AI Overview for this brand, not every query triggers one."
          />
        ) : (
          <ul className="space-y-2.5">
            {blocks.map((claim) => (
              <li key={String(claim._id)} className="rounded-sm border border-border bg-bg-inset/40 p-3">
                <p className="text-[13px] leading-5 text-fg">{displayClaimText(claim.text)}</p>
                <a
                  href={claim.evidenceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-fg hover:underline"
                >
                  Google&apos;s cited source <ArrowUpRight className="size-3" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

export function isSearchEngineHostname(hostname: string): boolean {
  return /(^|\.)google\.[a-z.]{2,}$/i.test(hostname);
}

export function sellerFromListingText(text: string): string | null {
  const match = text.match(/ listed by (.+?)(?= at | rated |\(matched to ")/);
  const seller = match?.[1]?.trim();
  return seller && seller.length > 0 ? seller : null;
}

export function sellerLabel(point: { claimId: string; hostname: string | null }, claimTextById: Map<string, string>): string {
  if (point.hostname && !isSearchEngineHostname(point.hostname)) return point.hostname;
  return sellerFromListingText(claimTextById.get(point.claimId) ?? "") ?? "unknown retailer";
}

function PriceLadderCard({ claims }: { claims: ClaimDoc[] }) {
  const points = useMemo(() => pricePoints(claims), [claims]);
  const claimTextById = useMemo(() => new Map(claims.map((claim) => [String(claim._id), claim.text])), [claims]);
  const min = points.length ? points[0].price : null;
  const max = points.length ? points[points.length - 1].price : null;
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">Price ladder</h3>
      </div>
      <div className="p-4">
        {points.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Layers {...iconProps} size={16} />}
            title="No product listing prices yet."
            description="Fills in once a check captures real SERP product listings for this brand, each price keeps the date it was observed, never shown as current truth."
          />
        ) : (
          <div className="space-y-3">
            <p className="flex flex-wrap items-center gap-1 font-mono text-xs text-muted-foreground">
              <MetricInfo
                label="Range observed"
                definition="The lowest and highest product-listing prices captured so far. Each price is a point-in-time observation from a real listing, not the brand's current price."
              />
              <span>
                : <span className="text-fg">{min}</span>–<span className="text-fg">{max}</span> {points[0].unit ?? ""} across {points.length} listing{points.length === 1 ? "" : "s"}
              </span>
            </p>
            <ul className="space-y-1.5">
              {points.map((point) => (
                <li key={point.claimId} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-[11px]">
                  <span className="truncate text-muted-foreground">{sellerLabel(point, claimTextById)}</span>
                  <span className="font-mono tabular-nums text-fg">{point.price}{point.unit ? ` ${point.unit}` : ""}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">as of {shortDate(point.fetchedAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}

function HookMixDriftChart({ current, previous }: { current: ClaimDoc[]; previous: ClaimDoc[] | null }) {
  const reduceMotion = useReducedMotion();
  const rows = useMemo(() => (previous === null ? [] : hookMixDrift(current, previous).slice(0, 9)), [current, previous]);
  const chartConfig = { current: { label: "This check" }, previous: { label: "Previous check" } } satisfies ChartConfig;
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
        <TrendingUp className="size-4 text-fg" aria-hidden />
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          <MetricInfo
            label="Hook-mix drift"
            definition="The change in hook-tag counts between this check and the previous tagged check. Bars show counts, not rates, so a larger check can lift every bar, a taller bar is more tags, not automatically a bigger share."
          />
        </h3>
      </div>
      <div className="p-4">
        {previous === null ? (
          <EmptyState
            size="sm"
            icon={<TrendingUp {...iconProps} size={16} />}
            title="No earlier check to compare."
            description="Drift needs a second tagged check. Check again later and this chart will compare hook counts check over check, never a guessed baseline."
          />
        ) : rows.every((row) => row.current === 0 && row.previous === 0) ? (
          <EmptyState
            size="sm"
            icon={<TrendingUp {...iconProps} size={16} />}
            title="No hook tags in either check."
            description="Neither this check nor the earlier one has real hook tags to compare yet."
          />
        ) : (
          <>
            <div className="mb-2 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: "var(--text-primary)" }} />
                This check
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: "var(--text-primary)", opacity: 0.35 }} />
                Previous check
              </span>
            </div>
            <ChartContainer config={chartConfig} className="h-[240px] w-full aspect-auto">
            <BarChart accessibilityLayer data={rows} margin={{ left: -16, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} interval={0} angle={-28} textAnchor="end" height={56} tickFormatter={(value: string) => hookName(value)} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 10 }} />
              <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08 }} content={<ChartTooltipContent labelFormatter={(value: unknown) => hookName(String(value))} />} />
              <Bar dataKey="previous" name="Previous check" radius={[2, 2, 0, 0]} barSize={12} isAnimationActive={!reduceMotion}>
                {rows.map((row) => (
                  <Cell key={`prev-${row.label}`} fill={HOOK_COLOR[row.label as HookType] ?? HOOK_COLOR.not_applicable} fillOpacity={0.35} />
                ))}
              </Bar>
              <Bar dataKey="current" name="This check" radius={[2, 2, 0, 0]} barSize={12} isAnimationActive={!reduceMotion}>
                {rows.map((row) => (
                  <Cell key={`cur-${row.label}`} fill={HOOK_COLOR[row.label as HookType] ?? HOOK_COLOR.not_applicable} />
                ))}
              </Bar>
            </BarChart>
            </ChartContainer>
          </>
        )}
      </div>
    </Panel>
  );
}

export function normalizeCtaRows(facet: readonly { value: string; count: number }[] | undefined): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of facet ?? []) {
    const normalized = row.value.trim().toLowerCase();
    if (isPlaceholderTagValue(normalized)) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + row.count);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function CtaMixCard({ brandId }: { brandId: BrandDoc["_id"] }) {
  const facet = useQuery(api.claims.ctaFacetByBrand, { brandId });
  const rows = useMemo(() => normalizeCtaRows(facet), [facet]);
  return (
    <RankedCatalogChart
      title="CTA mix"
      definition="How often a call-to-action (the action a piece of creative asks for, e.g. 'shop now' or 'learn more') was assigned by an enrichment check. Counts are of the same bounded, tagged sample as the hook and theme catalogs above, not of every finding, post, view, or spend."
      rows={rows}
      formatLabel={humanize}
      emptyTitle="No tagged CTAs yet."
      emptyDescription="Ranks the real call-to-action text an enrichment check assigned to findings, most frequent first, fills in after a tagged check."
      loading={facet === undefined}
    />
  );
}

export function PositionTab({
  brand,
  latestClaims,
  previousClaims,
  tags,
  filters,
  now,
}: {
  brand: BrandDoc;
  latestClaims: ClaimDoc[];
  previousClaims: ClaimDoc[] | null;
  tags: ClaimDoc[];
  filters: BrandFilters;
  now: number;
}) {
  const filteredLatest = useMemo(
    () => latestClaims.filter((claim) => matchesBrandFilters(claim, tagsForClaim(tags, claim), filters, now)),
    [latestClaims, tags, filters, now],
  );
  const previousTags = useMemo(() => (previousClaims ? tagBearingClaims(previousClaims) : []), [previousClaims]);
  const filteredPrevious = useMemo(
    () => (previousClaims === null ? null : previousClaims.filter((claim) => matchesBrandFilters(claim, tagsForClaim(previousTags, claim), filters, now))),
    [previousClaims, previousTags, filters, now],
  );
  const filteredTags = useMemo(() => tagBearingClaims(filteredLatest), [filteredLatest]);
  const hookTypeRows = useMemo(() => hookTypeFrequency(filteredTags), [filteredTags]);
  const themeRows = useMemo(() => themeFrequency(filteredTags).filter((row) => !isPlaceholderTagValue(row.label)), [filteredTags]);
  const valuePropRows = useMemo(
    () => valuePropFrequency(filteredTags).filter((row) => !isPlaceholderTagValue(row.label)),
    [filteredTags],
  );

  return (
    <div className="space-y-4">
      {/*
        No knowledge-graph card here, deliberately. Google does return a panel
        for these brands -- q=Mamaearth gives title, description, rating and
        review count -- but only for a bare ENTITY query. Our Google call
        qualifies the name with the vertical ("Mamaearth skincare") because a
        one-word brand that is also a common word returns the wrong results
        unqualified: q=Minimalist comes back with decluttering habits and
        lifestyle articles, which is what the qualifier was added to stop.
        The two cannot both be had from one call, and a second Google call per
        brand per run would double the most metered cost this product has, for
        a card that is a bonus by its own description. Measured: 0 of 56 ok
        Google snapshots ever carried a knowledge_graph block.

        The EXTRACTOR stays in convex/pipeline/extractClaims.ts -- it costs
        nothing and captures a panel on the rare call that returns one. If a
        knowledge card is ever wanted, the fix is a second entity-query call,
        not a change here.
      */}
      <AiOverviewPanel claims={filteredLatest} />
      {/*
        Ranked hook catalog, two levels of the same enrichment pass, both
        real server-side faceted counts from get_tags, never re-derived here:
        the fixed 9-value hookType vocabulary (colored on DESIGN.md's
        hookType hue scale, the Data-Color Rule, so a hue means the same
        thing here as it does in a chip elsewhere in the product), then the
        theme and valueProp free-text long tail underneath it, where the
        real specificity lives.
      */}
      <div>
        <h2 className="type-headline text-fg">Ranked hook catalog</h2>
        <p className="mb-3 text-[11px] text-muted-foreground">
          The fixed hookType vocabulary, then the free-text theme and value-proposition long tail underneath it, every count real and server-computed.
        </p>
        {/* Hook type stands alone, full width: its labels are single words, so
            the width is better spent on the free-text long tail below, whose
            sentence-length labels need the room lg:grid-cols-2 already gives
            them elsewhere in this tab. */}
        <RankedCatalogChart
          title="Hook type"
          definition="How often an enrichment check assigned each fixed hook type to a finding. Counts are of tagged findings, not of posts, views, or spend."
          rows={hookTypeRows}
          colorFor={(label) => HOOK_COLOR[label as HookType] ?? HOOK_COLOR.not_applicable}
          formatLabel={hookName}
          emptyTitle="No tagged hook types yet."
          emptyDescription="Ranks the real, fixed hook-type vocabulary an enrichment check assigned to findings, most frequent first, fills in after a tagged check."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <RankedCatalogChart
            title="Themes"
            definition="How often an enrichment check assigned each theme to a finding. The tag is free text, so two rows can mean the same thing in different words."
            rows={themeRows}
            emptyTitle="No tagged themes yet."
            emptyDescription="Ranks the real theme text an enrichment check assigned to findings, most frequent first, fills in after a tagged check."
          />
          <RankedCatalogChart
            title="Value propositions"
            definition="How often an enrichment check assigned each value proposition to a finding. The tag is free text, so two rows can mean the same thing in different words."
            rows={valuePropRows}
            emptyTitle="No tagged value propositions yet."
            emptyDescription="Ranks the real value-proposition text an enrichment check assigned to findings, most frequent first, fills in after a tagged check."
          />
          <CtaMixCard brandId={brand._id} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PriceLadderCard claims={filteredLatest} />
        <HookMixDriftChart current={filteredLatest} previous={filteredPrevious} />
      </div>
    </div>
  );
}
