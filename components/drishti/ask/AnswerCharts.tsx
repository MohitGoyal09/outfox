"use client";


import { TrendsChart, type TrendsChartResult } from "@/components/drishti/charts";
import { LIVE_PREVIEW_CAPTION, trendsResultsFromGroups } from "./ask-model";

type UnknownPart = { type?: unknown; state?: unknown; output?: unknown; toolCallId?: unknown };

function isTrendsOutput(value: unknown): value is TrendsChartResult {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { rows?: unknown };
  return Array.isArray(candidate.rows);
}

export function trendsResultsOf(message: { parts?: unknown }): TrendsChartResult[] {
  const parts = Array.isArray(message.parts) ? (message.parts as UnknownPart[]) : [];
  const out: TrendsChartResult[] = [];
  for (const part of parts) {
    if (part.type !== "tool-get_trends") continue;
    if (part.state !== "output-available") continue;
    if (!isTrendsOutput(part.output)) continue;
    if (part.output.rows.length === 0) continue;
    out.push(part.output);
  }
  return out;
}

export function fetchBrandPreviewResultsOf(message: { parts?: unknown }): TrendsChartResult[] {
  const parts = Array.isArray(message.parts) ? (message.parts as UnknownPart[]) : [];
  const out: TrendsChartResult[] = [];
  for (const part of parts) {
    if (part.type !== "tool-fetch_brand") continue;
    if (part.state !== "output-available") continue;
    if (typeof part.output !== "object" || part.output === null) continue;
    out.push(
      ...trendsResultsFromGroups(
        (part.output as { trendsGroups?: unknown }).trendsGroups,
        LIVE_PREVIEW_CAPTION,
      ),
    );
  }
  return out;
}

export function AnswerCharts({
  message,
  brandLabel,
  persistedResults,
}: {
  message: { parts?: unknown };
  brandLabel?: (brandId: string) => string;
  persistedResults?: TrendsChartResult[];
}) {
  const liveResults = [...trendsResultsOf(message), ...fetchBrandPreviewResultsOf(message)];
  const results = liveResults.length > 0 ? liveResults : (persistedResults ?? []);
  if (results.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-3">
      {results.map((result, i) => (
        <TrendsChart key={i} result={result} {...(brandLabel ? { brandLabel } : {})} />
      ))}
    </div>
  );
}
