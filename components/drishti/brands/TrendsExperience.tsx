"use client";

import { useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { CalendarDays, Globe2, Info, Loader2, Map as MapIcon, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { LABEL_CLASS } from "../tokens";
import { formatStamp } from "../cohorts/cohorts-model";
import type { ClaimDoc, SnapshotDoc } from "./brand-model";
import { PlatformLogo } from "./PlatformLogo";

export type TrendPoint = { date: string; label: string; query: string; interest: number };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

export function readTrendSeries(rawResponse: unknown): TrendPoint[] {
  const raw = record(rawResponse);
  const nested = record(raw?.interest_over_time);
  const timeline = Array.isArray(raw?.timeline_data) ? raw.timeline_data : Array.isArray(nested?.timeline_data) ? nested.timeline_data : [];
  return timeline.flatMap((entry) => {
    const row = record(entry);
    if (!row || typeof row.date !== "string" || !Array.isArray(row.values)) return [];
    const date = row.date;
    return row.values.flatMap((value) => {
      const item = record(value);
      return item && typeof item.query === "string" && typeof item.extracted_value === "number"
        ? [{ date, label: date, query: item.query, interest: item.extracted_value }]
        : [];
    });
  });
}

function dateValue(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function selectedRange(points: TrendPoint[], range: string): TrendPoint[] {
  if (range === "today 5-y" || points.length < 2) return points;
  const last = Math.max(...points.map((point) => dateValue(point.date)));
  const days = range === "now 7-d" ? 7 : range === "today 1-m" ? 31 : range === "today 3-m" ? 93 : 365;
  const cutoff = last - days * 86400000;
  return points.filter((point) => dateValue(point.date) >= cutoff);
}

const lineColors = ["#0f766e", "#2563eb", "#d97706", "#dc2626", "#0891b2"];

function ScopeControl({ icon: Icon, label, value, children, onChange, pending = false }: { icon: typeof CalendarDays; label: string; value: string; children: React.ReactNode; onChange: (value: string) => void; pending?: boolean }) {
  return <label className={cn("flex min-w-[130px] items-center gap-2 rounded-lg border px-3 py-2 text-xs", pending ? "border-accent/40 bg-accent/[0.05] text-accent" : "border-border bg-background text-muted-foreground")}><Icon className="size-3.5 shrink-0" /><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent font-medium text-foreground outline-none">{children}</select>{pending ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent" /> : null}</label>;
}

function EmptyTrend({
  brandName,
  message,
  onRefresh,
  refreshing,
  hideAction = false,
}: {
  brandName: string;
  message?: string;
  onRefresh: () => void;
  refreshing: boolean;
  hideAction?: boolean;
}) {
  return (
    <div className="grid min-h-[300px] place-items-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
      <div>
        <PlatformLogo engine="google_trends" className="mx-auto size-7" />
        <p className="mt-4 text-sm font-medium">No timeline stored for {brandName}</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted-foreground">
          {message ??
            "Run a Google Trends refresh to store dated interest points. The average score alone cannot produce a chart."}
        </p>
        {hideAction ? null : (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2 rounded-lg"
            disabled={refreshing}
            onClick={onRefresh}
          >
            {refreshing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <TrendingUp className="size-3.5" />
            )}
            Run refresh
          </Button>
        )}
      </div>
    </div>
  );
}

function chartRows(points: TrendPoint[], brandName: string) {
  const names = [...new Set(points.map((point) => point.query))];
  const keys = new Map(names.map((name, index) => [name, `series_${index}`]));
  const keyOf = (name: string) => keys.get(name) ?? "series_unknown";
  const dates = [...new Set(points.map((point) => point.date))].sort((a, b) => dateValue(a) - dateValue(b));
  return { names, keyOf, data: dates.map((date) => Object.fromEntries([["date", date], ...names.map((name) => [keyOf(name), points.find((point) => point.date === date && point.query === name)?.interest ?? null])])) , label: names.find((name) => name.toLowerCase() === brandName.toLowerCase()) ?? names[0] };
}

type TrendsGeo = "IN" | "US" | "GB" | "CA" | "AU";
type TrendsDate = "now 7-d" | "today 1-m" | "today 3-m" | "today 12-m" | "today 5-y";

const REGION_LABELS: Record<TrendsGeo, string> = { IN: "India", US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia" };

function regionLabel(code: string): string {
  return REGION_LABELS[code as TrendsGeo] ?? code;
}

export function TrendsExperience({ snapshot, claims, brandId, brandName, latestRunAt }: { snapshot?: SnapshotDoc; claims: ClaimDoc[]; brandId: Id<"brands">; brandName: string; latestRunAt?: string | null }) {
  const refreshTrends = useAction(api.pipeline.refreshTrends.refreshTrends);
  const storedDate = record(snapshot?.queryParams)?.date;
  const initialDate: TrendsDate = typeof storedDate === "string" && ["now 7-d", "today 1-m", "today 3-m", "today 12-m", "today 5-y"].includes(storedDate) ? storedDate as TrendsDate : "today 3-m";
  const [range, setRange] = useState<TrendsDate>(initialDate);
  const [region, setRegion] = useState(snapshot?.region ?? "IN");
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeSnapshot = useQuery(api.snapshots.latestByEngineAndRegion, {
    brandId,
    engine: "google_trends",
    region,
  });
  const regionLoading = activeSnapshot === undefined;
  const noStoredData = activeSnapshot === null;
  const points = useMemo(() => readTrendSeries(activeSnapshot?.rawResponse), [activeSnapshot?.rawResponse]);
  const filtered = useMemo(() => selectedRange(points, range), [points, range]);
  const rows = useMemo(() => chartRows(filtered, brandName), [filtered, brandName]);
  const target = rows.label;
  const targetPoints = filtered.filter((point) => point.query === target);
  const avg = targetPoints.length ? Math.round(targetPoints.reduce((sum, point) => sum + point.interest, 0) / targetPoints.length * 10) / 10 : null;
  const peak = targetPoints.reduce<TrendPoint | null>((best, point) => !best || point.interest > best.interest ? point : best, null);
  const config = Object.fromEntries(rows.names.map((name, index) => [rows.keyOf(name), { label: name, color: lineColors[index % lineColors.length] }])) satisfies ChartConfig;
  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const result = await refreshTrends({ brandId, geo: region, date: range });
      if (!result.ok) throw new Error(result.error);
      setConfirming(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The live Trends refresh could not start.");
    } finally {
      setRefreshing(false);
    }
  }
  return <section className="space-y-4" aria-label="Google Trends intelligence">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><PlatformLogo engine="google_trends" className="size-4" /><h2 className="text-base font-semibold">Search interest over time</h2></div><p className="mt-1 text-xs text-muted-foreground">Relative index from the latest stored Google Trends run{latestRunAt ? `, captured ${formatStamp(latestRunAt)}` : ""}.</p></div><Button variant="outline" size="sm" className={cn("gap-2 rounded-lg", noStoredData && "border-accent bg-accent/10 text-accent hover:bg-accent/15")} onClick={() => setConfirming(true)}><TrendingUp className="size-3.5" />Refresh {regionLabel(region)}</Button></div>
    <div className="flex flex-wrap gap-2"><ScopeControl icon={CalendarDays} label="Date range" value={range} onChange={(value) => setRange(value as TrendsDate)}><option value="now 7-d">Last 7 days</option><option value="today 1-m">Last month</option><option value="today 3-m">Last 3 months</option><option value="today 12-m">Last 12 months</option><option value="today 5-y">Last 5 years</option></ScopeControl><ScopeControl icon={Globe2} label="Geography" value={region} onChange={setRegion} pending={noStoredData}><option value="IN">India</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="CA">Canada</option><option value="AU">Australia</option></ScopeControl><span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground"><Info className="size-3.5" />Geography switches instantly between already-stored regions. Date range filters the stored chart locally.</span></div>
    {confirming ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/[0.05] p-4"><div><p className="text-sm font-medium">Run a live Google Trends fetch?</p><p className="mt-1 text-xs text-muted-foreground">This makes one live SerpApi Google Trends call for {regionLabel(region)} and stores it for next time. It does not touch any other evidence engine, and costs far less than a full brand refresh.</p>{error ? <p role="alert" className="mt-2 text-xs text-red-600">{error}</p> : null}</div><div className="flex items-center gap-2"><Button variant="ghost" size="sm" disabled={refreshing} onClick={() => setConfirming(false)}>Cancel</Button><Button size="sm" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <TrendingUp className="size-3.5" />}Run refresh</Button></div></div> : null}
    {regionLoading ? (
      <div className="grid min-h-[300px] place-items-center rounded-xl border border-dashed border-border bg-muted/20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ) : filtered.length < 2 ? (
      <EmptyTrend
        brandName={brandName}
        message={noStoredData ? `No stored Google Trends data for ${regionLabel(region)} yet.` : undefined}
        onRefresh={() => setConfirming(true)}
        refreshing={refreshing}
        hideAction={confirming}
      />
    ) : (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid border-b border-border sm:grid-cols-[1fr_auto]">
          <div className="px-5 py-4">
            <p className={cn(LABEL_CLASS, "text-muted-foreground")}>
              {rows.names.length > 1 ? "Within-chunk comparison" : "Brand interest"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Google Trends scores are relative within this query chunk, not search volume.</p>
          </div>
          <div className="grid grid-cols-2 border-t border-border sm:border-l sm:border-t-0">
            <div className="px-4 py-3">
              <p className={cn(LABEL_CLASS, "text-muted-foreground")}>Average</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{avg ?? "n/a"}</p>
            </div>
            <div className="border-l border-border px-4 py-3">
              <p className={cn(LABEL_CLASS, "text-muted-foreground")}>Peak</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{peak?.interest ?? "n/a"}</p>
            </div>
          </div>
        </div>
        <div className="px-3 pb-4 pt-6 sm:px-5">
          <ChartContainer config={config} className="h-[340px] w-full aspect-auto">
            <BarChart accessibilityLayer data={rows.data} margin={{ left: -12, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={36} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={38} />
              <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08, radius: 4 }} content={<ChartTooltipContent indicator="line" />} />
              <Legend verticalAlign="top" align="right" height={28} wrapperStyle={{ fontSize: 11 }} />
              {rows.names.map((name) => (
                <Bar
                  key={name}
                  dataKey={rows.keyOf(name)}
                  name={name}
                  fill={`var(--color-${rows.keyOf(name)})`}
                  radius={[3, 3, 0, 0]}
                  fillOpacity={name === target ? 1 : 0.55}
                  maxBarSize={rows.names.length > 1 ? 14 : 22}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    )}
    <div aria-live="polite" className={cn("rounded-lg border px-4 py-3 text-xs leading-5", noStoredData ? "border-accent/30 bg-accent/[0.05] text-foreground" : "border-border bg-muted/30 text-muted-foreground")}>
      <MapIcon className="mr-1 inline size-3.5" />
      {noStoredData
        ? `No live Google Trends fetch has been run for ${regionLabel(region)} yet. Refresh ${regionLabel(region)} to store one.`
        : `The chart shows stored ${regionLabel(region)} data${activeSnapshot?.fetchedAt ? `, captured ${formatStamp(activeSnapshot.fetchedAt)}` : ""}. Comparison lines appear only when Google returned the same dated query chunk.`}
    </div>
    {claims.length > 0 ? <p className="text-[11px] text-muted-foreground">{claims.filter((claim) => claim.metric === "google_trends_avg_interest").length} stored trend claims support this view.</p> : null}
  </section>;
}
