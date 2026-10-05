"use client";

import { Notice } from "../../Notice";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MetricInfo } from "../../MetricInfo";
import { Panel } from "../../Panel";
import { HOOK_COLOR, type HookType } from "../../tokens";
import { hookName, humanize } from "@/components/drishti/labels";
import { NotFoundInCheck } from "../NotFoundInCheck";
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
import { groupLabelRows, hiddenConversationalNote, splitConversational } from "../panel-rules";

const PLACEHOLDER_TAG_VALUES = new Set(["unspecified", "none", "n/a", "unknown", ""]);
export function isPlaceholderTagValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "" ||
    PLACEHOLDER_TAG_VALUES.has(normalized) ||
    normalized.startsWith("unspecified") ||
    normalized.includes("placeholder")
  );
}

function AiOverviewPanel({ blocks, hiddenCount }: { blocks: ClaimDoc[]; hiddenCount: number }) {
  const hiddenNote = hiddenConversationalNote(hiddenCount);
  return (
    <Panel interactive={false} className="overflow-hidden">
      <Panel.Header title="Google AI Overview" />
      <div className="p-4">
        <Notice title="Google's synthesis, not ours" className="mb-3">
          Google&apos;s own generated summary of this brand, not a primary source and not Drishti&apos;s analysis. Every line below links to the page Google actually cited.
        </Notice>
          <ul className="space-y-2.5">
            {blocks.map((claim) => (
              <li key={String(claim._id)} className="rounded-sm border border-border bg-bg-inset/40 p-3">
                <p className="text-[13px] leading-5 text-fg">{displayClaimText(claim.text)}</p>
                <a
                  href={claim.evidenceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs text-fg hover:underline"
                >
                  Google&apos;s cited source <ArrowUpRight className="size-3" />
                </a>
              </li>
            ))}
          </ul>
          {hiddenNote !== null ? <p className="mt-3 text-xs leading-4 text-muted-foreground">{hiddenNote}.</p> : null}
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

function PriceLadderCard({ claims, points }: { claims: ClaimDoc[]; points: ReturnType<typeof pricePoints> }) {
  const claimTextById = useMemo(() => new Map(claims.map((claim) => [String(claim._id), claim.text])), [claims]);
  const min = points[0].price;
  const max = points[points.length - 1].price;
  const asOf = points.reduce((latest, point) => (point.fetchedAt > latest ? point.fetchedAt : latest), points[0].fetchedAt);
  return (
    <Panel interactive={false} className="overflow-hidden">
      <Panel.Header title="Price ladder" />
      <div className="p-4">
          <div className="space-y-3">
            <p className="flex flex-wrap items-center gap-1 font-mono text-xs text-muted-foreground">
              <MetricInfo
                label="Range observed"
                definition="The lowest and highest product-listing prices captured so far. Each price is a point-in-time observation from a real listing, not the brand's current price."
              />
              <span>
                : <span className="text-fg">{min}</span>–<span className="text-fg">{max}</span> {points[0].unit ?? ""} across {points.length} listing{points.length === 1 ? "" : "s"}, as of {shortDate(asOf)}
              </span>
            </p>
            <ul className="space-y-1.5">
              {points.map((point) => (
                <li key={point.claimId} className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs">
                  <span className="truncate text-muted-foreground">{sellerLabel(point, claimTextById)}</span>
                  <span className="font-mono tabular-nums text-fg">{point.price}{point.unit ? ` ${point.unit}` : ""}</span>
                </li>
              ))}
            </ul>
          </div>
      </div>
    </Panel>
  );
}

function driftRows(current: ClaimDoc[], previous: ClaimDoc[] | null) {
  if (previous === null) return [];
  const rows = hookMixDrift(current, previous).slice(0, 9);
  return rows.every((row) => row.current === 0 && row.previous === 0) ? [] : rows;
}

function HookMixDriftChart({ rows }: { rows: ReturnType<typeof hookMixDrift> }) {
  const reduceMotion = useReducedMotion();
  const chartConfig = { current: { label: "This check" }, previous: { label: "Previous check" } } satisfies ChartConfig;
  return (
    <Panel interactive={false} className="overflow-hidden">
      <Panel.Header title={<MetricInfo
            label="Hook-mix drift"
            definition="The change in hook-tag counts between this check and the previous tagged check. Bars show counts, not rates, so a larger check can lift every bar, a taller bar is more tags, not automatically a bigger share."
          />} />
      <div className="p-4">
          <>
            <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
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
      </div>
    </Panel>
  );
}

export function normalizeCtaRows(facet: readonly { value: string; count: number }[] | undefined): { label: string; count: number }[] {
  const real = (facet ?? []).filter((row) => !isPlaceholderTagValue(row.value)).map((row) => ({ label: row.value, count: row.count }));
  return groupLabelRows(real);
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
  const themeRows = useMemo(() => groupLabelRows(themeFrequency(filteredTags).filter((row) => !isPlaceholderTagValue(row.label))), [filteredTags]);
  const valuePropRows = useMemo(
    () => groupLabelRows(valuePropFrequency(filteredTags).filter((row) => !isPlaceholderTagValue(row.label))),
    [filteredTags],
  );

  const ctaFacet = useQuery(api.claims.ctaFacetByBrand, { brandId: brand._id });
  const ctaRows = useMemo(() => normalizeCtaRows(ctaFacet), [ctaFacet]);
  const aiSplit = useMemo(() => splitConversational(aiOverviewClaims(filteredLatest)), [filteredLatest]);
  const aiBlocks = aiSplit.kept;
  const pricePointRows = useMemo(() => pricePoints(filteredLatest), [filteredLatest]);
  const driftData = useMemo(() => driftRows(filteredLatest, filteredPrevious), [filteredLatest, filteredPrevious]);

  const notFound = [
    hookTypeRows.length === 0 ? "Hook types" : null,
    themeRows.length === 0 ? "Themes" : null,
    valuePropRows.length === 0 ? "Value propositions" : null,
    ctaFacet !== undefined && ctaRows.length === 0 ? "CTA mix" : null,
    aiBlocks.length === 0 && aiSplit.hidden === 0 ? "Google AI Overview" : null,
    pricePointRows.length === 0 ? "Price ladder" : null,
    driftData.length === 0 ? "Hook-mix drift" : null,
  ].filter((item): item is string => item !== null);

  const neutralBar = () => "var(--text-secondary)";

  return (
    <div className="space-y-4">
      {/* No knowledge-graph card, deliberately: Google returns one only for a
          bare entity query, and our vertical-qualified query never triggers it
          (measured 0 of 56 ok Google snapshots). The extractor stays in
          convex/pipeline/extractClaims.ts; the fix, if ever wanted, is a
          second entity-query call, not a change here. */}
      {aiBlocks.length > 0 || aiSplit.hidden > 0 ? <AiOverviewPanel blocks={aiBlocks} hiddenCount={aiSplit.hidden} /> : null}
      {hookTypeRows.length > 0 ? (
        <RankedCatalogChart
          title="Hook type"
          definition="How often an enrichment check assigned each fixed hook type to a finding. Counts are of tagged findings, not of posts, views, or spend."
          rows={hookTypeRows}
          colorFor={(label) => HOOK_COLOR[label as HookType] ?? HOOK_COLOR.not_applicable}
          formatLabel={hookName}
          emptyTitle="No tagged hook types yet."
          emptyDescription="Fills in after a tagged check."
        />
      ) : null}
      {themeRows.length > 0 || valuePropRows.length > 0 || ctaRows.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {themeRows.length > 0 ? (
            <RankedCatalogChart
              title="Themes"
              definition="How often an enrichment check assigned each theme to a finding. The tag is free text, so two rows can mean the same thing in different words."
              rows={themeRows}
              colorFor={neutralBar}
              formatLabel={humanize}
              emptyTitle="No tagged themes yet."
              emptyDescription="Fills in after a tagged check."
            />
          ) : null}
          {valuePropRows.length > 0 ? (
            <RankedCatalogChart
              title="Value propositions"
              definition="How often an enrichment check assigned each value proposition to a finding. The tag is free text, so two rows can mean the same thing in different words."
              rows={valuePropRows}
              colorFor={neutralBar}
              formatLabel={humanize}
              emptyTitle="No tagged value propositions yet."
              emptyDescription="Fills in after a tagged check."
            />
          ) : null}
          {ctaRows.length > 0 ? (
            <RankedCatalogChart
              title="CTA mix"
              definition="How often a call-to-action (the action a piece of creative asks for, e.g. 'shop now' or 'learn more') was assigned by an enrichment check. Counts are of the same bounded, tagged sample as the hook and theme catalogs above, not of every finding, post, view, or spend."
              rows={ctaRows}
              colorFor={neutralBar}
              formatLabel={humanize}
              emptyTitle="No tagged CTAs yet."
              emptyDescription="Fills in after a tagged check."
            />
          ) : null}
        </div>
      ) : null}
      {pricePointRows.length > 0 || driftData.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {pricePointRows.length > 0 ? <PriceLadderCard claims={filteredLatest} points={pricePointRows} /> : null}
          {driftData.length > 0 ? <HookMixDriftChart rows={driftData} /> : null}
        </div>
      ) : null}
      <NotFoundInCheck items={notFound} />
    </div>
  );
}
