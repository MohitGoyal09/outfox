"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { cn } from "@/lib/utils";
import { hookName } from "@/components/drishti/labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { FUNNEL_COLOR, FUNNEL_STAGE_INDEX, HOOK_COLOR, type FunnelStage, type HookType } from "../tokens";
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

export const DONUT_MIN_DISTINCT = 3;

function hookRow(row: DistributionItem): DistributionItem & { count: number } {
  return { label: row.label, count: row.count ?? 0, sharePct: null, delta: row.delta };
}

function HookFallback({ rows, total }: { rows: DistributionItem[]; total: number }) {
  if (rows.length === 1) {
    const row = rows[0];
    return (
      <div className="flex items-center gap-3">
        <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: HOOK_COLOR[row.label as HookType] ?? "#6b7280" }} />
        <div>
          <p className="font-mono text-2xl font-semibold leading-none tabular-nums text-foreground">{Intl.NumberFormat("en-US").format(row.count ?? 0)}</p>
          <p className="mt-1 text-[11px] capitalize text-muted-foreground">{hookName(row.label)}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-[11px]">
          <span className="flex min-w-0 items-center gap-2 capitalize">
            <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: HOOK_COLOR[row.label as HookType] ?? "#6b7280" }} />
            <span className="truncate">{hookName(row.label)}</span>
          </span>
          <span className="font-mono tabular-nums text-muted-foreground">{Intl.NumberFormat("en-US").format(row.count ?? 0)}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{total ? `${Math.round(((row.count ?? 0) / total) * 100)}%` : "—"}</span>
          <DeltaTag delta={row.delta} />
        </div>
      ))}
    </div>
  );
}

export function HookChart({ items }: { items: DistributionItem[] }) {
  const rows = [...items].map(hookRow).filter((row) => row.count > 0).sort((a, b) => b.count - a.count).slice(0, 9);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No hook tags in this check.</p>;
  if (rows.length < DONUT_MIN_DISTINCT) return <HookFallback rows={rows} total={total} />;
  const chartConfig = Object.fromEntries(
    rows.map((row) => [row.label, { label: hookName(row.label), color: HOOK_COLOR[row.label as HookType] ?? "#6b7280" }]),
  ) satisfies ChartConfig;
  return (
    <div className="grid grid-cols-[92px_1fr] items-center gap-4">
      <div className="relative mx-auto size-[92px]">
        <ChartContainer config={chartConfig} className="aspect-square size-[92px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
            <Pie data={rows} dataKey="count" nameKey="label" innerRadius={26} outerRadius={44} strokeWidth={1}>
              {rows.map((row) => (
                <Cell key={row.label} fill={HOOK_COLOR[row.label as HookType] ?? "#6b7280"} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{Intl.NumberFormat("en-US").format(total)}</span>
          <span className="text-[7px] uppercase tracking-wide text-muted-foreground">evidence</span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[11px]">
            <span className="flex min-w-0 items-center gap-2 capitalize">
              <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: HOOK_COLOR[row.label as HookType] ?? "#6b7280" }} />
              <span className="truncate">{hookName(row.label)}</span>
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{Intl.NumberFormat("en-US").format(row.count)}</span>
            <DeltaTag delta={row.delta} />
          </div>
        ))}
      </div>
    </div>
  );
}

const FUNNEL_ORDER: readonly [FunnelStage, string][] = [
  ["unaware", "Awareness"],
  ["problem_aware", "Problem aware"],
  ["solution_aware", "Solution aware"],
  ["product_aware", "Product aware"],
  ["most_aware", "Most aware"],
];

const FUNNEL_EMPTY_BAND_PCT = 4;

export function FunnelPanel({ items }: { items: DistributionItem[] }) {
  const byLabel = new Map(items.map((item) => [item.label, item]));
  const rows = FUNNEL_ORDER.map(([stage, label]) => ({
    stage,
    label,
    count: byLabel.get(stage)?.count ?? 0,
    delta: byLabel.get(stage)?.delta ?? null,
  }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground">Stage tags will appear after an enriched check.</p>;
  return (
    <div className="space-y-1.5" role="img" aria-label="Awareness-stage distribution, one bar per stage from a shared left baseline">
      {rows.map((row) => {
        const sharePct = total ? Math.round((row.count / total) * 100) : 0;
        const widthPct = row.count > 0 ? Math.max(2, sharePct) : FUNNEL_EMPTY_BAND_PCT;
        return (
          <div key={row.stage} className="grid grid-cols-[100px_1fr_auto_auto] items-center gap-2 text-[11px]">
            <span className="truncate">{FUNNEL_STAGE_INDEX[row.stage] + 1}. {row.label}</span>
            <span className="h-4 w-full overflow-hidden rounded-[3px] bg-muted/40">
              {row.count > 0 ? (
                <span className="block h-full rounded-[3px]" style={{ width: `${widthPct}%`, backgroundColor: FUNNEL_COLOR[row.stage] }} />
              ) : (
                <span className="block h-full rounded-[3px] border border-dashed border-border-strong/70" style={{ width: `${widthPct}%` }} />
              )}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{total ? `${sharePct}%` : "—"}</span>
            <DeltaTag delta={row.delta} />
          </div>
        );
      })}
    </div>
  );
}
