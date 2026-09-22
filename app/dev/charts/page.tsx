"use client";


import { TrendsChart, type TrendsChartResult } from "@/components/drishti/charts";

const BRAND_NAMES: Record<string, string> = {
  brand_mamaearth: "Mamaearth",
  brand_wow: "WOW Skin Science",
  brand_plum: "Plum Goodness",
  brand_sugar: "SUGAR Cosmetics",
};

function label(brandId: string): string {
  return BRAND_NAMES[brandId] ?? brandId;
}

const twoChunkResult: TrendsChartResult = {
  total: 4,
  coverage: { google_trends: "ok" },
  asOf: "2026-09-20T09:15:00.000Z",
  rows: [
    { id: "1", brandId: "brand_mamaearth", chunkKey: "chunk-a", value: 62, period: "2026-08-20..2026-09-19", evidenceUrl: "https://trends.google.com/trends/explore?q=Mamaearth", fetchedAt: "2026-09-20T09:15:00.000Z" },
    { id: "2", brandId: "brand_wow", chunkKey: "chunk-a", value: 41, period: "2026-08-20..2026-09-19", evidenceUrl: "https://trends.google.com/trends/explore?q=WOW", fetchedAt: "2026-09-20T09:15:00.000Z" },
    { id: "3", brandId: "brand_plum", chunkKey: "chunk-b", value: 28, period: "2026-08-20..2026-09-19", evidenceUrl: "https://trends.google.com/trends/explore?q=Plum", fetchedAt: "2026-09-20T09:15:00.000Z" },
    { id: "4", brandId: "brand_sugar", chunkKey: "chunk-b", value: 77, period: "2026-08-20..2026-09-19", evidenceUrl: "https://trends.google.com/trends/explore?q=SUGAR", fetchedAt: "2026-09-20T09:15:00.000Z" },
  ],
};

const oneChunkOverTimeResult: TrendsChartResult = {
  total: 6,
  coverage: { google_trends: "ok" },
  asOf: "2026-09-20T09:15:00.000Z",
  rows: [
    { id: "10", brandId: "brand_mamaearth", chunkKey: "chunk-a", value: 55, period: "2026-07-01..2026-07-31", evidenceUrl: "https://trends.google.com/trends/explore?q=Mamaearth", fetchedAt: "2026-08-01T09:00:00.000Z" },
    { id: "11", brandId: "brand_wow", chunkKey: "chunk-a", value: 38, period: "2026-07-01..2026-07-31", evidenceUrl: "https://trends.google.com/trends/explore?q=WOW", fetchedAt: "2026-08-01T09:00:00.000Z" },
    { id: "12", brandId: "brand_mamaearth", chunkKey: "chunk-a", value: 60, period: "2026-08-01..2026-08-31", evidenceUrl: "https://trends.google.com/trends/explore?q=Mamaearth", fetchedAt: "2026-09-01T09:00:00.000Z" },
    { id: "13", brandId: "brand_wow", chunkKey: "chunk-a", value: 44, period: "2026-08-01..2026-08-31", evidenceUrl: "https://trends.google.com/trends/explore?q=WOW", fetchedAt: "2026-09-01T09:00:00.000Z" },
    { id: "14", brandId: "brand_mamaearth", chunkKey: "chunk-a", value: 62, period: "2026-08-20..2026-09-19", evidenceUrl: "https://trends.google.com/trends/explore?q=Mamaearth", fetchedAt: "2026-09-20T09:15:00.000Z" },
    { id: "15", brandId: "brand_wow", chunkKey: "chunk-a", value: 41, period: "2026-08-20..2026-09-19", evidenceUrl: "https://trends.google.com/trends/explore?q=WOW", fetchedAt: "2026-09-20T09:15:00.000Z" },
  ],
};

const oneBrandResult: TrendsChartResult = {
  total: 1,
  coverage: { google_trends: "ok" },
  asOf: "2026-09-20T09:15:00.000Z",
  rows: [
    { id: "20", brandId: "brand_mamaearth", chunkKey: "chunk-a", value: 62, period: "2026-08-20..2026-09-19", evidenceUrl: "https://trends.google.com/trends/explore?q=Mamaearth", fetchedAt: "2026-09-20T09:15:00.000Z" },
  ],
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
      <Demo title="1. Two brands, two chunks -> two panels" result={twoChunkResult} />
      <Demo title="2. Two brands, one chunk, three fetches -> one panel, real line" result={oneChunkOverTimeResult} />
      <Demo title="3. One brand -> single panel, no small-multiple chrome" result={oneBrandResult} />
      <Demo title="4. Empty rows -> no trends data state" result={emptyResult} />
      <Demo title="5. coverage.google_trends === missing -> named engine" result={missingEngineResult} />
    </main>
  );
}
