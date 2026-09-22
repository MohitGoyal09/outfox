"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import type { DistributionItem } from "../DistributionPanel";


export function FilterSelect({ icon: Icon, label, value, onChange, options }: { icon: LucideIcon; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="group inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-normal text-muted-foreground transition-[border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-muted focus-within:border-accent/50 focus-within:shadow-[0_0_0_3px_rgba(15,118,110,0.12)] active:scale-[0.98] motion-reduce:transition-[border-color,box-shadow] motion-reduce:active:scale-100">
      <Icon className="size-3.5" />
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className="appearance-none bg-transparent text-xs font-normal text-foreground outline-none focus:outline-none focus-visible:outline-none">
        <option value="all">{label}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className="size-3 transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] group-focus-within:rotate-180 motion-reduce:transition-none motion-reduce:group-focus-within:rotate-0" />
    </label>
  );
}

export function DeltaTag({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta === 0) return <span className="font-mono text-[10px] text-muted-foreground">±0</span>;
  const positive = delta > 0;
  return <span className={cn("font-mono text-[10px]", positive ? "text-emerald-600" : "text-red-600")}>{positive ? "+" : ""}{delta}</span>;
}

export function SummaryPanel({ title, subtitle, children, className }: { title: string; subtitle?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("min-h-[206px] rounded-xl border-border bg-card py-0 shadow-none", className)}>
      <CardHeader className="border-b border-border/70 px-4 py-3">
        <CardTitle className="text-[13px] font-semibold tracking-[-0.01em]">{title}</CardTitle>
        {subtitle}
      </CardHeader>
      <CardContent className="px-4 py-4">{children}</CardContent>
    </Card>
  );
}

export function HookChart({ items }: { items: DistributionItem[] }) {
  const colors = ["#0f766e", "#34a853", "#4285f4", "#fbbc05", "#ea4335", "#64748b"];
  const rows = [...items].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 6);
  const total = rows.reduce((sum, row) => sum + (row.count ?? 0), 0);
  const segments = rows.map((row, index) => { const start = rows.slice(0, index).reduce((sum, r) => sum + (r.count ?? 0), 0); const end = start + (row.count ?? 0); return `${colors[index]} ${total ? start / total * 100 : 0}% ${total ? end / total * 100 : 0}%`; });
  return rows.length ? <div className="grid grid-cols-[92px_1fr] items-center gap-4"><div className="relative size-[92px] rounded-full" style={{ background: `conic-gradient(${segments.join(",")})` }}><div className="absolute inset-[19px] grid place-items-center rounded-full bg-card text-center"><NumberTicker value={total} className="text-lg font-semibold leading-none" /><span className="text-[9px] text-muted-foreground">evidence</span></div></div><div className="space-y-2">{rows.map((row, index) => <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[11px]"><span className="flex min-w-0 items-center gap-2 capitalize"><span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: colors[index] }} /><span className="truncate">{row.label.replaceAll("_", " ")}</span></span><NumberTicker value={row.count ?? 0} className="font-mono text-muted-foreground" /><DeltaTag delta={row.delta} /></div>)}</div></div> : <p className="text-sm text-muted-foreground">No hook tags in this run.</p>;
}

const FUNNEL_ORDER = [["unaware", "Awareness"], ["problem_aware", "Problem aware"], ["solution_aware", "Solution aware"], ["product_aware", "Product aware"], ["most_aware", "Most aware"]] as const;

export function FunnelPanel({ items }: { items: DistributionItem[] }) {
  const colors = ["#0f766e", "#2aa198", "#67c9bc", "#f2c94c", "#f59e0b"];
  const byLabel = new Map(items.map((item) => [item.label, item]));
  const rows = FUNNEL_ORDER.map(([stage, label]) => ({ label, count: byLabel.get(stage)?.count ?? 0, delta: byLabel.get(stage)?.delta ?? null }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return total ? <div className="space-y-1.5">{rows.map((row, index) => <div key={row.label} className="grid grid-cols-[92px_1fr_auto_auto] items-center gap-2 text-[11px]"><span className="flex h-6 items-center justify-center text-[10px] font-medium text-white" style={{ backgroundColor: colors[index], clipPath: `polygon(${index * 6}% 0, ${100 - index * 6}% 0, ${94 - index * 6}% 100%, ${6 + index * 6}% 100%)` }}><NumberTicker value={row.count} className="text-[10px] font-medium text-white" /></span><span className="truncate">{index + 1}. {row.label}</span><span className="font-mono text-muted-foreground"><NumberTicker value={Math.round(row.count / total * 100)} />%</span><DeltaTag delta={row.delta} /></div>)}</div> : <p className="text-sm text-muted-foreground">Funnel tags will appear after an enriched run.</p>;
}
