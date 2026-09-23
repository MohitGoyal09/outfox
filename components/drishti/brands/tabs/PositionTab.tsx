"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BookOpen, Layers, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "../../EmptyState";
import { iconProps, HOOK_COLOR, type HookType } from "../../tokens";
import { RankedCatalogChart } from "../RankedCatalogChart";
import {
  aiOverviewClaims,
  hookMixDrift,
  hookTypeFrequency,
  knowledgeAttributeClaims,
  knowledgeDescriptionClaims,
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

function KnowledgeGraphCard({ brand, latestClaims }: { brand: BrandDoc; latestClaims: ClaimDoc[] }) {
  const descriptions = knowledgeDescriptionClaims(latestClaims);
  const attributes = knowledgeAttributeClaims(latestClaims);
  if (descriptions.length === 0 && attributes.length === 0) {
    return (
      <Card className="shadow-none">
        <CardContent className="py-4">
          <EmptyState
            size="sm"
            icon={<BookOpen {...iconProps} size={16} />}
            title="No knowledge-graph panel for this brand."
            description="Google doesn't show a knowledge panel for every brand — this bonus card fills in only when one is stored, it is not required for the rest of this tab."
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <BookOpen className="size-4 text-accent" />
        <CardTitle className="text-sm">Knowledge graph identity</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {descriptions.length > 0 ? <p className="text-sm leading-6 text-foreground">{displayClaimText(descriptions[0].text)}</p> : null}
          {attributes.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
              {attributes.map((claim) => (
                <div key={String(claim._id)} className="min-w-0">
                  <dt className="truncate text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">{claim.metric ?? "Attribute"}</dt>
                  <dd className="truncate font-medium text-foreground">{String(claim.value ?? displayClaimText(claim.text))}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function AiOverviewPanel({ claims }: { claims: ClaimDoc[] }) {
  const blocks = aiOverviewClaims(claims);
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <Sparkles className="size-4 text-accent" />
        <CardTitle className="text-sm">Google AI Overview</CardTitle>
        <Badge variant="outline" className="ml-auto h-5 rounded-full px-2 text-[10px] font-normal text-muted-foreground">Google&apos;s synthesis, not ours</Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="mb-3 text-[11px] leading-5 text-muted-foreground">
          Google&apos;s own generated summary of this brand, not a primary source and not Drishti&apos;s analysis. Every line below links to the page Google actually cited.
        </p>
        {blocks.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Sparkles {...iconProps} size={16} />}
            title="No AI Overview stored yet."
            description="Fills in once a run captures Google's AI Overview for this brand — not every query triggers one."
          />
        ) : (
          <ul className="space-y-2.5">
            {blocks.map((claim) => (
              <li key={String(claim._id)} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-[13px] leading-5 text-foreground">{displayClaimText(claim.text)}</p>
                <a
                  href={claim.evidenceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                >
                  Google&apos;s cited source <ArrowUpRight className="size-3" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PriceLadderCard({ claims }: { claims: ClaimDoc[] }) {
  const points = useMemo(() => pricePoints(claims), [claims]);
  const min = points.length ? points[0].price : null;
  const max = points.length ? points[points.length - 1].price : null;
  return (
    <Card className="shadow-none">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="text-sm">Price ladder</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {points.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Layers {...iconProps} size={16} />}
            title="No product listing prices stored yet."
            description="Fills in once a run captures real SERP product listings for this brand — each price keeps the date it was observed, never shown as current truth."
          />
        ) : (
          <div className="space-y-3">
            <p className="font-mono text-xs text-muted-foreground">
              Range observed: <span className="text-foreground">{min}</span>–<span className="text-foreground">{max}</span> {points[0].unit ?? ""} across {points.length} listing{points.length === 1 ? "" : "s"}
            </p>
            <ul className="space-y-1.5">
              {points.map((point) => (
                <li key={point.claimId} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-[11px]">
                  <span className="truncate text-muted-foreground">{point.hostname ?? "unknown retailer"}</span>
                  <span className="font-mono tabular-nums text-foreground">{point.price}{point.unit ? ` ${point.unit}` : ""}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">as of {shortDate(point.fetchedAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HookMixDriftChart({ current, previous }: { current: ClaimDoc[]; previous: ClaimDoc[] | null }) {
  const rows = useMemo(() => (previous === null ? [] : hookMixDrift(current, previous).slice(0, 9)), [current, previous]);
  const chartConfig = { current: { label: "This run" }, previous: { label: "Previous run" } } satisfies ChartConfig;
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <TrendingUp className="size-4 text-accent" />
        <CardTitle className="text-sm">Hook-mix drift</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {previous === null ? (
          <EmptyState
            size="sm"
            icon={<TrendingUp {...iconProps} size={16} />}
            title="No previous run to compare."
            description="Drift needs a second tagged run. Run a refresh again later and this chart will compare hook counts run over run — never a guessed baseline."
          />
        ) : rows.every((row) => row.current === 0 && row.previous === 0) ? (
          <EmptyState
            size="sm"
            icon={<TrendingUp {...iconProps} size={16} />}
            title="No hook tags in either run."
            description="Neither this run nor the previous one has real hook tags to compare yet."
          />
        ) : (
          <ChartContainer config={chartConfig} className="h-[240px] w-full aspect-auto">
            <BarChart accessibilityLayer data={rows} margin={{ left: -16, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} interval={0} angle={-28} textAnchor="end" height={56} tickFormatter={(value: string) => value.replaceAll("_", " ")} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 10 }} />
              <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08 }} content={<ChartTooltipContent labelFormatter={(value: unknown) => String(value).replaceAll("_", " ")} />} />
              <Bar dataKey="previous" name="Previous run" radius={[2, 2, 0, 0]} barSize={12}>
                {rows.map((row) => (
                  <Cell key={`prev-${row.label}`} fill={HOOK_COLOR[row.label as HookType] ?? "#6b7280"} fillOpacity={0.35} />
                ))}
              </Bar>
              <Bar dataKey="current" name="This run" radius={[2, 2, 0, 0]} barSize={12}>
                {rows.map((row) => (
                  <Cell key={`cur-${row.label}`} fill={HOOK_COLOR[row.label as HookType] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
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
  const themeRows = useMemo(() => themeFrequency(filteredTags), [filteredTags]);
  const valuePropRows = useMemo(() => valuePropFrequency(filteredTags), [filteredTags]);

  return (
    <div className="space-y-4">
      <KnowledgeGraphCard brand={brand} latestClaims={filteredLatest} />
      <AiOverviewPanel claims={filteredLatest} />
      {/*
        Ranked hook catalog — two levels of the same enrichment pass, both
        real server-side faceted counts from get_tags, never re-derived here:
        the fixed 9-value hookType vocabulary (colored on DESIGN.md's
        hookType hue scale — the Data-Color Rule, so a hue means the same
        thing here as it does in a chip elsewhere in the product), then the
        theme and valueProp free-text long tail underneath it, where the
        real specificity lives.
      */}
      <div>
        <h2 className="mb-1 text-sm font-semibold tracking-[-0.02em]">Ranked hook catalog</h2>
        <p className="mb-3 text-[11px] text-muted-foreground">
          The fixed hookType vocabulary, then the free-text theme and value-proposition long tail underneath it — every count real and server-computed.
        </p>
        {/* Hook type stands alone, full width: its labels are single words, so
            the width is better spent on the free-text long tail below, whose
            sentence-length labels need the room lg:grid-cols-2 already gives
            them elsewhere in this tab. */}
        <RankedCatalogChart
          title="Hook type"
          rows={hookTypeRows}
          colorFor={(label) => HOOK_COLOR[label as HookType] ?? "#6b7280"}
          emptyTitle="No tagged hook types yet."
          emptyDescription="Ranks the real, fixed hookType vocabulary an enrichment run assigned to stored claims, most frequent first — fills in after a tagged run."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <RankedCatalogChart
            title="Themes"
            rows={themeRows}
            emptyTitle="No tagged themes yet."
            emptyDescription="Ranks the real theme text an enrichment run assigned to stored claims, most frequent first — fills in after a tagged run."
          />
          <RankedCatalogChart
            title="Value propositions"
            rows={valuePropRows}
            emptyTitle="No tagged value propositions yet."
            emptyDescription="Ranks the real valueProp text an enrichment run assigned to stored claims, most frequent first — fills in after a tagged run."
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PriceLadderCard claims={filteredLatest} />
        <HookMixDriftChart current={filteredLatest} previous={filteredPrevious} />
      </div>
    </div>
  );
}
