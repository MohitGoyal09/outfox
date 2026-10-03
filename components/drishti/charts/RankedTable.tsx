"use client";

import type { ReactNode } from "react";
import { TableProperties } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { MetricInfo } from "../MetricInfo";
import { Panel } from "../Panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { iconProps } from "../tokens";
import type { ChartCountRow } from "./DonutChart";

export function RankedTable({ title, definition, rows, emptyTitle, emptyDescription }: { title: string; /** Plain-language explanation of what this count measures, rendered as a `?` beside the title. */ definition?: ReactNode; rows: ChartCountRow[]; emptyTitle: string; emptyDescription: string }) {
  return (
    <Panel interactive={false} className="overflow-hidden">
      <div className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-fg">
          {definition ? <MetricInfo label={title} definition={definition} /> : title}
        </h3>
        {rows.length > 0 ? <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{rows.length} rows</span> : null}
      </div>
      <div className="p-4">
        {rows.length === 0 ? (
          <EmptyState size="sm" icon={<TableProperties {...iconProps} size={16} />} title={emptyTitle} description={emptyDescription} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="max-w-[28ch] truncate font-medium text-fg">{row.label}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-fg">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Panel>
  );
}
