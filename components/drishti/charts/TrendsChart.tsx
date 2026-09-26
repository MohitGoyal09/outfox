"use client";


import { useId, useMemo } from "react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { Coverage } from "@/lib/agentTypes";
import {
  CHART_TOOLTIP_SURFACE,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatStamp } from "../cohorts/cohorts-model";
import { EmptyState } from "../EmptyState";
import { Panel } from "../Panel";
import { ABSENT, LABEL_CLASS, VALUE_CLASS, categoricalColor, iconProps } from "../tokens";
import { canConnectWithLine, groupByChunk, type ChunkGroup, type TrendsChunkRow } from "./groupByChunk";
import { compareTrendsDates } from "@/convex/lib/trendsDate";

export type TrendsChartResult = {
  rows: TrendsChunkRow[];
  total: number;
  coverage: Coverage;
  asOf: string | null;
  caption?: string;
};

export type TrendsChartProps = {
  result: TrendsChartResult;
  brandLabel?: (brandId: string) => string;
  caption?: string;
  className?: string;
};

const VALUE_DOMAIN: [number, number] = [0, 100];

function seriesColor(index: number): string {
  return categoricalColor(index);
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatAxisDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return ABSENT;
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${day} ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

function numericOf(value: string | number | undefined): number | null {
  if (value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type ChunkChartPoint = { date: string } & Record<string, unknown>;

function buildChunkSeries(rows: readonly TrendsChunkRow[]): {
  brandIds: string[];
  data: ChunkChartPoint[];
} {
  const brandIds = [...new Set(rows.map((r) => r.brandId))];
  const dates = [...new Set(rows.map((r) => r.date))].sort(compareTrendsDates);
  const data = dates.map((date) => {
    const point: ChunkChartPoint = { date };
    for (const brandId of brandIds) {
      const match = rows.find((r) => r.brandId === brandId && r.date === date);
      point[brandId] = numericOf(match?.value);
      point[`${brandId}__period`] = match?.period ?? null;
    }
    return point;
  });
  return { brandIds, data };
}

function ChunkPanel({
  group,
  brandLabel,
  showChrome,
}: {
  group: ChunkGroup;
  brandLabel: (brandId: string) => string;
  showChrome: boolean;
}) {
  const { brandIds, data } = buildChunkSeries(group.rows);
  const config = Object.fromEntries(
    brandIds.map((brandId, index) => [
      brandId,
      { label: brandLabel(brandId), color: seriesColor(index) },
    ]),
  ) satisfies ChartConfig;
  const hasWindowRows = !canConnectWithLine(group.rows);

  return (
    <Panel interactive={false} padded className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>
          query chunk · {group.chunkKey}
        </span>
        <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary)]")}>
          {brandIds.length} {brandIds.length === 1 ? "brand" : "brands"}
        </span>
      </div>
      {hasWindowRows ? (
        <p className="text-[12px] leading-[1.5] text-[var(--text-secondary)]">
          Each dot is a 30-day average from the last run, not a daily reading --
          refresh Trends for this brand to get a real daily series. Dots are
          shown unconnected on purpose: a line would imply days were measured
          in between, and none were.
        </p>
      ) : showChrome ? (
        <p className="text-[12px] leading-[1.5] text-[var(--text-secondary)]">
          Values in this panel are comparable to each other only. Google Trends
          normalises interest within one query chunk, so a different chunk is
          never on this same scale.
        </p>
      ) : null}
      <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
        <LineChart data={data} margin={{ left: -12, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}
            tickFormatter={formatAxisDate}
          />
          <YAxis
            domain={VALUE_DOMAIN}
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--accent)", strokeOpacity: 0.25 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              return (
                <div className={cn(CHART_TOOLTIP_SURFACE, "min-w-40")}>
                  <p className={cn(VALUE_CLASS, "text-[10.5px] uppercase tracking-[0.07em] text-fg-tertiary")}>
                    {formatAxisDate(String(label))}
                  </p>
                  {payload.map((entry) => (
                    <p key={String(entry.dataKey)} className="mt-1 flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-fg-secondary">
                        {config[String(entry.dataKey)]?.label}
                      </span>
                      <span className={cn(VALUE_CLASS, "ml-auto text-fg")}>
                        {entry.value === null || entry.value === undefined ? ABSENT : entry.value}
                      </span>
                    </p>
                  ))}
                </div>
              );
            }}
          />
          {brandIds.length > 1 ? (
            <ChartLegend
              verticalAlign="top"
              height={28}
              content={<ChartLegendContent className="pb-2 pt-0" />}
            />
          ) : null}
          {brandIds.map((brandId) => (
            <Line
              key={brandId}
              type="monotone"
              dataKey={brandId}
              name={brandLabel(brandId)}
              stroke={hasWindowRows ? "none" : `var(--color-${brandId})`}
              strokeWidth={2}
              dot={{ r: 3.5, fill: `var(--color-${brandId})`, stroke: "var(--bg-raised)", strokeWidth: 1 }}
              activeDot={{ r: 4.5, fill: `var(--color-${brandId})`, stroke: "var(--bg-raised)", strokeWidth: 1.5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </Panel>
  );
}

export function TrendsChart({ result, brandLabel, caption: captionProp, className }: TrendsChartProps) {
  const headingId = useId();
  const resolveLabel = brandLabel ?? ((brandId: string) => brandId);
  const groups = useMemo(() => groupByChunk(result.rows), [result.rows]);
  const showChrome = groups.length > 1;
  const missingEngine = result.coverage.google_trends === "missing";
  const caption = captionProp ?? result.caption ?? null;

  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h3 id={headingId} className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)]">
          <TrendingUp {...iconProps} size={16} className="text-[var(--accent)]" aria-hidden="true" />
          Search interest
        </h3>
        <span className={cn(VALUE_CLASS, "text-[11px] text-[var(--text-tertiary)]")}>
          as of {formatStamp(result.asOf)}
        </span>
      </div>
      {caption !== null && caption !== "" ? (
        <p className="text-[12px] leading-[1.5] text-[var(--text-secondary)]">{caption}</p>
      ) : null}

      {missingEngine ? (
        <EmptyState
          size="sm"
          bounded
          icon={<AlertTriangle {...iconProps} size={16} aria-hidden="true" />}
          title="Google Trends: no data"
          description="The google_trends engine has no coverage for this request. Nothing here is estimated or interpolated -- run a Trends fetch to populate it."
        />
      ) : groups.length === 0 ? (
        <EmptyState
          size="sm"
          bounded
          icon={<TrendingUp {...iconProps} size={16} aria-hidden="true" />}
          title="No trends data"
          description="No stored Google Trends interest points match this request yet."
        />
      ) : (
        <div className={cn("flex flex-col gap-3", showChrome && "sm:grid sm:grid-cols-2 sm:gap-4")}>
          {groups.map((group) => (
            <ChunkPanel
              key={group.chunkKey}
              group={group}
              brandLabel={resolveLabel}
              showChrome={showChrome}
            />
          ))}
        </div>
      )}
    </section>
  );
}
