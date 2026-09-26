"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ExternalLink, Globe2, Link2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStamp } from "../cohorts/cohorts-model";
import { sourceName } from "@/components/drishti/labels";
import { CategoryAxisTick } from "../charts/CategoryAxisTick";
import { EmptyState } from "../EmptyState";
import { MetricInfo } from "../MetricInfo";
import { Panel } from "../Panel";
import { categoricalColorFor, iconProps } from "../tokens";
import { type ClaimDoc } from "./brand-model";

type Destination = { key: string; url: string; count: number; firstSeen: string; lastSeen: string; engines: string[] };

function normalizeUrl(value: string): string | null {
  try { const url = new URL(value); if (!/^https?:$/.test(url.protocol)) return null; return url.toString(); } catch { return null; }
}

function destinationRows(claims: ClaimDoc[]): Destination[] {
  const map = new Map<string, Destination>();
  for (const claim of claims) {
    const url = normalizeUrl(claim.evidenceUrl);
    if (!url || claim.sourceEngine === "google_trends" || claim.sourceEngine === "llm_tag") continue;
    const parsed = new URL(url);
    const key = `${parsed.hostname}${parsed.pathname}`.replace(/\/$/, "");
    const existing = map.get(key);
    if (existing) { existing.count += 1; existing.firstSeen = existing.firstSeen < claim.fetchedAt ? existing.firstSeen : claim.fetchedAt; existing.lastSeen = existing.lastSeen > claim.fetchedAt ? existing.lastSeen : claim.fetchedAt; if (!existing.engines.includes(claim.sourceEngine)) existing.engines.push(claim.sourceEngine); }
    else map.set(key, { key, url, count: 1, firstSeen: claim.fetchedAt, lastSeen: claim.fetchedAt, engines: [claim.sourceEngine] });
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function DestinationsPanel({ claims }: { claims: ClaimDoc[] }) {
  const rows = useMemo(() => destinationRows(claims), [claims]);
  const top = rows.slice(0, 5).map((row) => ({ label: row.key, count: row.count, fill: categoricalColorFor(row.key) }));
  const chartConfig = { count: { label: "Evidence", color: "var(--accent)" } } satisfies ChartConfig;
  return (
    <section className="space-y-4" aria-label="Destination intelligence">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="size-4 text-fg" aria-hidden />
            <h2 className="type-headline text-fg">
              <MetricInfo
                label="Destinations in the evidence set"
                definition="Every real URL captured in search and video evidence, grouped by page. Counts are of findings we stored; no historical counts or traffic estimates are inferred."
              />
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Ranked URLs from search and video evidence. No historical counts are inferred.</p>
        </div>
        <Badge variant="outline" className="rounded-full tabular-nums">{rows.length} destinations</Badge>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          bounded
          icon={<Link2 {...iconProps} size={16} />}
          title="No destination URLs yet."
          description="A Search or YouTube check with evidence links will populate this view."
        />
      ) : (
        <>
          <Panel interactive={false} className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
                <MetricInfo
                  label="Evidence count by destination"
                  definition="How many stored findings point at each destination URL. It counts evidence rows, not visits, clicks, or page traffic."
                />
              </h3>
            </div>
            <div className="p-4">
              <ChartContainer config={chartConfig} className="h-[240px] w-full aspect-auto">
                <BarChart accessibilityLayer data={top} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis dataKey="label" type="category" width={188} tickLine={false} axisLine={false} tick={CategoryAxisTick(26)} interval={0} />
                  <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08, radius: 4 }} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} barSize={22}>
                    {top.map((row) => <Cell key={row.label} fill={row.fill} />)}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </Panel>
          <Panel interactive={false} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold tracking-[-0.01em] text-fg">Ranked landing pages</p>
              <p className="font-mono text-xs tabular-nums text-muted-foreground">{claims.length} findings scanned</p>
            </div>
            <div className="max-h-[560px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <MetricInfo
                        label="Destination"
                        definition="The page URL the captured findings link to."
                      />
                    </TableHead>
                    <TableHead>
                      <MetricInfo
                        label="Evidence"
                        definition="Number of stored findings that link to this destination."
                      />
                    </TableHead>
                    <TableHead>
                      <MetricInfo
                        label="Seen"
                        definition="The first and last dates we captured a finding for this destination."
                      />
                    </TableHead>
                    <TableHead>
                      <MetricInfo
                        label="Sources"
                        definition="Which engines contributed findings that link to this destination."
                      />
                    </TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="max-w-[330px]">
                        <a href={row.url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 font-medium hover:text-fg hover:underline">
                          <Link2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="truncate">{row.key}</span>
                        </a>
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">{row.count}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">
                        {formatStamp(row.firstSeen)}
                        <br />
                        <span className="text-[10px]">to {formatStamp(row.lastSeen)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[180px] flex-wrap gap-1">
                          {row.engines.map((engine) => (
                            <Badge key={engine} variant="outline" className="h-5 rounded-full px-1.5 text-[10px]">{sourceName(engine).replace("Google ", "")}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <a href={row.url} target="_blank" rel="noreferrer noopener" aria-label={`Open ${row.key}`} className="inline-flex rounded-sm p-1.5 text-muted-foreground hover:bg-bg-inset hover:text-fg">
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Panel>
        </>
      )}
    </section>
  );
}
