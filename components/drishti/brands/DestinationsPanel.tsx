"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ExternalLink, Globe2, Link2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStamp } from "../cohorts/cohorts-model";
import { sourceName } from "@/components/drishti/labels";
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
  const top = rows.slice(0, 5);
  const chartConfig = { count: { label: "Evidence", color: "#0f766e" } } satisfies ChartConfig;
  return <section className="space-y-4" aria-label="Destination intelligence"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2"><Globe2 className="size-4 text-accent" /><h2 className="text-base font-semibold">Destinations in the evidence set</h2></div><p className="mt-1 text-xs text-muted-foreground">Ranked URLs from search and video evidence. No historical counts are inferred.</p></div><Badge variant="outline" className="rounded-full">{rows.length} destinations</Badge></div>{rows.length === 0 ? <div className="grid min-h-[240px] place-items-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center"><div><Link2 className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No destination URLs yet</p><p className="mt-1 text-xs text-muted-foreground">A Search or YouTube check with evidence links will populate this view.</p></div></div> : <><Card className="shadow-none"><CardHeader className="pb-2"><CardTitle className="text-sm">Evidence count by destination</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="h-[240px] w-full aspect-auto"><BarChart accessibilityLayer data={top.map((row) => ({ name: row.key.length > 24 ? `${row.key.slice(0, 24)}…` : row.key, count: row.count }))} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}><CartesianGrid horizontal={false} /><XAxis type="number" allowDecimals={false} hide /><YAxis dataKey="name" type="category" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.08, radius: 4 }} content={<ChartTooltipContent />} /><Bar dataKey="count" fill="var(--color-count)" radius={4} barSize={22} /></BarChart></ChartContainer></CardContent></Card><div className="overflow-hidden rounded-xl border border-border"><div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-semibold">Ranked landing pages</p><p className="text-xs text-muted-foreground">{claims.length} findings scanned</p></div><div className="max-h-[560px] overflow-auto"><Table><TableHeader><TableRow><TableHead>Destination</TableHead><TableHead>Evidence</TableHead><TableHead>Seen</TableHead><TableHead>Sources</TableHead><TableHead className="text-right">Open</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.key}><TableCell className="max-w-[330px]"><a href={row.url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 font-medium hover:text-accent"><Link2 className="size-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{row.key}</span></a></TableCell><TableCell className="font-mono text-xs">{row.count}</TableCell><TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">{formatStamp(row.firstSeen)}<br /><span className="text-[10px]">to {formatStamp(row.lastSeen)}</span></TableCell><TableCell><div className="flex max-w-[180px] flex-wrap gap-1">{row.engines.map((engine) => <Badge key={engine} variant="outline" className="h-5 rounded-full px-1.5 text-[10px]">{sourceName(engine).replace("Google ", "")}</Badge>)}</div></TableCell><TableCell className="text-right"><a href={row.url} target="_blank" rel="noreferrer noopener" aria-label={`Open ${row.key}`} className="inline-flex rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><ExternalLink className="size-3.5" /></a></TableCell></TableRow>)}</TableBody></Table></div></div></>}</section>;
}
