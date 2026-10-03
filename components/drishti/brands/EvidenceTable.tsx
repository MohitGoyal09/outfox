"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { hookName, sourceName, stageName } from "../labels";
import { RelativeTime } from "../RelativeTime";
import { PlatformLogo } from "./PlatformLogo";
import { formatRowValue, sortEvidenceRows, type EvidenceRow, type EvidenceRowKey } from "./evidence-table-model";

type SortState = { key: EvidenceRowKey; dir: "asc" | "desc" } | null;

const NOT_TAGGED = <span className="text-fg-tertiary">Not tagged</span>;

function SortHead({ label, sortKey, sort, onSort, className }: {
  label: string;
  sortKey: EvidenceRowKey;
  sort: SortState;
  onSort: (key: EvidenceRowKey) => void;
  className?: string;
}) {
  const active = sort?.key === sortKey ? sort.dir : null;
  const Icon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <TableHead
      aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"}
      className={cn("sticky top-0 z-10 bg-bg-raised text-xs text-fg-secondary", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="-mx-1 inline-flex items-center gap-1 rounded-sm px-1 py-1 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {label}
        <Icon aria-hidden className={cn("size-3", active ? "text-foreground" : "text-fg-tertiary")} />
      </button>
    </TableHead>
  );
}

export function EvidenceTable({ rows }: { rows: EvidenceRow[] }) {
  const [sort, setSort] = useState<SortState>(null);
  const shown = useMemo(() => (sort ? sortEvidenceRows(rows, sort.key, sort.dir) : rows), [rows, sort]);

  const onSort = (key: EvidenceRowKey) =>
    setSort((current) =>
      current?.key !== key ? { key, dir: "asc" } : current.dir === "asc" ? { key, dir: "desc" } : null,
    );

  return (
    <div className="max-w-full overflow-hidden rounded-lg border border-border bg-bg-raised [&_[data-slot=table-container]]:max-h-[70vh] [&_[data-slot=table-container]]:overflow-auto">
      <Table className="min-w-[760px]">
        <TableHeader className="[&_tr]:border-border">
          <TableRow className="hover:bg-transparent">
            <SortHead label="Source" sortKey="engine" sort={sort} onSort={onSort} className="w-44" />
            <TableHead className="sticky top-0 z-10 bg-bg-raised text-xs text-fg-secondary">Finding</TableHead>
            <TableHead className="sticky top-0 z-10 bg-bg-raised text-xs text-fg-secondary">Hook</TableHead>
            <TableHead className="sticky top-0 z-10 bg-bg-raised text-xs text-fg-secondary">Stage</TableHead>
            <SortHead label="Value" sortKey="value" sort={sort} onSort={onSort} />
            <SortHead label="Fetched" sortKey="fetchedAt" sort={sort} onSort={onSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((row) => (
            <TableRow key={row.id} className="h-11 border-border hover:bg-bg-raised-2">
              <TableCell className="px-3">
                <span className="inline-flex items-center gap-2">
                  <PlatformLogo engine={row.engine} />
                  {sourceName(row.engine)}
                </span>
              </TableCell>
              <TableCell className="max-w-md min-w-72 px-3 whitespace-normal">
                <a
                  href={row.url}
                  target="_blank"
                  rel="noreferrer"
                  className="line-clamp-2 rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {row.text}
                </a>
              </TableCell>
              <TableCell className="px-3">{row.hook ? hookName(row.hook) : NOT_TAGGED}</TableCell>
              <TableCell className="px-3">{row.stage ? stageName(row.stage) : NOT_TAGGED}</TableCell>
              <TableCell className="px-3 tabular-nums">{formatRowValue(row)}</TableCell>
              <TableCell className="px-3 text-fg-secondary">
                <RelativeTime iso={row.fetchedAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
