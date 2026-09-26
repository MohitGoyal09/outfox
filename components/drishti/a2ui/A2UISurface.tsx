"use client";


import { useQuery } from "convex/react";
import { TriangleAlert } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "../EmptyState";
import { hookName, sourceName } from "../labels";
import { HOOK_TYPES, categoricalColorFor, iconProps } from "../tokens";
import { RankedCatalogChart } from "../brands/RankedCatalogChart";
import { DonutChart, RankedTable, StackedBarChart, TrendsChart, type TrendsChartResult } from "../charts";
import { parseA2UI, resolveA2UI, type ResolvedNode, type SettledToolResult } from "./protocol";

const STORED_ID_RE = /^[a-z0-9]{20,}$/;

function looksLikeTrends(output: unknown): output is TrendsChartResult {
  return typeof output === "object" && output !== null && Array.isArray((output as { rows?: unknown }).rows);
}

export function A2UISurface({ text, results }: { text: string; results: SettledToolResult[] }) {
  const brands = useQuery(api.brands.listBrands);

  const parsed = parseA2UI(text);
  if (!parsed.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[a2ui] rejected surface:", parsed.problems);
    }
    return null;
  }
  if (brands === undefined) return null;

  const labelFor = (raw: string): string | null => {
    if ((HOOK_TYPES as readonly string[]).includes(raw)) return hookName(raw);
    const brand = brands.find((row) => String(row._id) === raw);
    if (brand !== undefined) return brand.name;
    if (STORED_ID_RE.test(raw)) return null;
    return sourceName(raw);
  };

  const tree = resolveA2UI(parsed, results, labelFor);
  return <div className="mt-3 flex flex-col gap-3">{render(tree)}</div>;
}

function render(node: ResolvedNode): React.ReactNode {
  if (node.kind === "container") {
    return (
      <div key={node.id} className="flex flex-col gap-3">
        {node.children.map(render)}
      </div>
    );
  }
  if (node.kind === "bar") {
    return (
      <RankedCatalogChart
        key={node.id}
        title={node.title}
        rows={node.rows}
        colorFor={categoricalColorFor}
        emptyTitle="No rows to chart"
        emptyDescription="This turn returned no countable rows for that view."
      />
    );
  }
  if (node.kind === "line") {
    if (!looksLikeTrends(node.series)) {
      return <Cannot key={node.id} title={node.title} reason="that result is not a series" />;
    }
    return <TrendsChart key={node.id} result={node.series} />;
  }
  if (node.kind === "donut") {
    return (
      <DonutChart
        key={node.id}
        title={node.title}
        rows={node.rows}
        emptyTitle="No rows to chart"
        emptyDescription="This turn returned no countable rows for that view."
      />
    );
  }
  if (node.kind === "stacked-bar") {
    return (
      <StackedBarChart
        key={node.id}
        title={node.title}
        rows={node.rows}
        emptyTitle="No rows to chart"
        emptyDescription="This turn returned no countable rows for that view."
      />
    );
  }
  if (node.kind === "table") {
    return (
      <RankedTable
        key={node.id}
        title={node.title}
        rows={node.rows}
        emptyTitle="No rows to chart"
        emptyDescription="This turn returned no countable rows for that view."
      />
    );
  }
  return <Cannot key={node.id} title={node.title} reason={node.reason} />;
}

function Cannot({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-raised-2 p-4 shadow-[var(--shadow-xs)]">
      <EmptyState size="sm" icon={<TriangleAlert {...iconProps} size={16} />} title={title} description={reason} />
    </div>
  );
}
