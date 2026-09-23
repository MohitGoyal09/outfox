"use client";


import { TrendsChart, type TrendsChartResult } from "@/components/drishti/charts";
import type { TrendsChunkRow } from "@/components/drishti/charts/groupByChunk";

const BRAND_NAMES: Record<string, string> = {
  brand_mamaearth: "Mamaearth",
  brand_wow: "WOW Skin Science",
  brand_plum: "Plum Goodness",
  brand_sugar: "SUGAR Cosmetics",
};

function label(brandId: string): string {
  return BRAND_NAMES[brandId] ?? brandId;
}

function weeklyDates(startIso: string, count: number): string[] {
  const start = new Date(startIso);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i * 7);
    return d.toISOString().slice(0, 10);
  });
}

let nextRowId = 1;

function timelineRows(
  brandId: string,
  chunkKey: string,
  dates: string[],
  values: number[],
  fetchedAt: string,
): TrendsChunkRow[] {
  return dates.map((date, i) => ({
    id: String(nextRowId++),
    brandId,
    chunkKey,
    date,
    value: values[i % values.length],
    evidenceUrl: `https://trends.google.com/trends/explore?q=${encodeURIComponent(label(brandId))}`,
    fetchedAt,
  }));
}

const FETCHED_AT = "2026-09-20T09:15:00.000Z";
const DATES_13W = weeklyDates("2026-06-22", 13);

const twoChunkResult: TrendsChartResult = {
  total: 4 * DATES_13W.length,
  coverage: { google_trends: "ok" },
  asOf: FETCHED_AT,
  rows: [
    ...timelineRows("brand_mamaearth", "chunk-a", DATES_13W, [40, 44, 47, 50, 53, 55, 58, 57, 60, 59, 61, 60, 62], FETCHED_AT),
    ...timelineRows("brand_wow", "chunk-a", DATES_13W, [30, 31, 33, 35, 34, 36, 38, 37, 39, 40, 41, 40, 41], FETCHED_AT),
    ...timelineRows("brand_plum", "chunk-b", DATES_13W, [20, 21, 19, 22, 24, 23, 25, 26, 25, 27, 28, 27, 28], FETCHED_AT),
    ...timelineRows("brand_sugar", "chunk-b", DATES_13W, [65, 68, 70, 72, 69, 71, 74, 73, 75, 76, 74, 77, 77], FETCHED_AT),
  ],
};

const oneChunkOverTimeResult: TrendsChartResult = {
  total: 2 * DATES_13W.length,
  coverage: { google_trends: "ok" },
  asOf: FETCHED_AT,
  rows: [
    ...timelineRows("brand_mamaearth", "chunk-a", DATES_13W, [42, 45, 48, 52, 55, 54, 57, 56, 59, 60, 61, 62, 62], FETCHED_AT),
    ...timelineRows("brand_wow", "chunk-a", DATES_13W, [28, 30, 33, 32, 35, 36, 34, 37, 38, 39, 40, 41, 41], FETCHED_AT),
  ],
};

const oneBrandResult: TrendsChartResult = {
  total: DATES_13W.length,
  coverage: { google_trends: "ok" },
  asOf: FETCHED_AT,
  rows: timelineRows("brand_mamaearth", "chunk-a", DATES_13W, [42, 45, 48, 52, 55, 54, 57, 56, 59, 60, 61, 62, 62], FETCHED_AT),
};

const emptyResult: TrendsChartResult = {
  total: 0,
  coverage: { google_trends: "ok" },
  asOf: null,
  rows: [],
};

const missingEngineResult: TrendsChartResult = {
  total: 0,
  coverage: { google_trends: "missing" },
  asOf: null,
  rows: [],
};

function Demo({ title, result }: { title: string; result: TrendsChartResult }) {
  return (
    <section className="flex flex-col gap-3 border-b border-[var(--border,#e4e7ec)] py-8">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-tertiary,#98a2b3)]">
        {title}
      </h2>
      <TrendsChart result={result} brandLabel={label} />
    </section>
  );
}

export default function DevChartsPage() {
  return (
    <main className="mx-auto flex max-w-[1000px] flex-col gap-2 bg-[var(--bg,#f6f7f4)] px-4 py-8 sm:px-8">
      <h1 className="text-[1.4rem] font-semibold text-[var(--text-primary,#17191d)]">
        TrendsChart — dev harness
      </h1>
      <p className="text-[13px] text-[var(--text-secondary,#667085)]">
        Not a product route. For browser verification of components/drishti/charts/TrendsChart.tsx only.
      </p>
      <Demo title="1. Two brands, two chunks -> two panels, each a real multi-point line" result={twoChunkResult} />
      <Demo title="2. Two brands, one chunk, one fetch -> one panel, full 13-point timeline" result={oneChunkOverTimeResult} />
      <Demo title="3. One brand -> single panel, no small-multiple chrome" result={oneBrandResult} />
      <Demo title="4. Empty rows -> no trends data state" result={emptyResult} />
      <Demo title="5. coverage.google_trends === missing -> named engine" result={missingEngineResult} />
    </main>
  );
}
