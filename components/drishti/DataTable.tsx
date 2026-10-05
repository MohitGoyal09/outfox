"use client";


import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, type EmptyStateProps } from "./EmptyState";
import { Skeleton, SkeletonRegion } from "./Skeleton";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  kind?: "primary" | "numeric" | "action" | "default";
  hideOnMobile?: boolean;
  className?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  label: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  loadingRows?: number;
  empty?: EmptyStateProps;
  className?: string;
};

const INTERACTIVE = "a,button,input,select,textarea,[role='menuitem'],[role='button']";

function headClass(kind: DataTableColumn<unknown>["kind"]) {
  return cn(
    "h-9 px-4 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-fg-tertiary",
    kind === "numeric" && "text-right",
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  label,
  onRowClick,
  loading = false,
  loadingRows = 4,
  empty,
  className,
}: DataTableProps<T>) {
  if (!loading && rows.length === 0 && empty) {
    return <EmptyState bounded {...empty} className={cn(empty.className, className)} />;
  }

  function activate(row: T, event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (!event.currentTarget.contains(target) || target.closest(INTERACTIVE)) return;
    onRowClick?.(row);
  }

  return (
    <div
      className={cn(
        "overflow-clip rounded-lg border border-border bg-bg-raised shadow-xs",
        className,
      )}
    >
      <table
        aria-label={label}
        aria-busy={loading || undefined}
        className="w-full text-sm max-md:block [&_tbody]:max-md:block"
      >
        <TableHeader className="sticky top-16 z-10 bg-bg-inset max-md:sr-only [&_tr]:border-border">
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.id}
                scope="col"
                className={cn(headClass(col.kind), col.className)}
              >
                {col.kind === "action" ? <span className="sr-only">{col.header}</span> : col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: loadingRows }, (_, index) => (
                <TableRow
                  key={index}
                  className="border-border hover:bg-transparent max-md:flex max-md:flex-col max-md:gap-2 max-md:p-4"
                >
                  {columns.map((col, i) => (
                    <TableCell
                      key={col.id}
                      className={cn("px-4 py-3.5", col.className, "max-md:w-auto max-md:p-0", col.hideOnMobile && "max-md:hidden")}
                    >
                      {i === 0 ? (
                        <SkeletonRegion label="Loading rows">
                          <Skeleton variant="text" height={14} width="60%" />
                        </SkeletonRegion>
                      ) : col.kind === "action" ? null : (
                        <Skeleton
                          variant="text"
                          height={12}
                          width={col.kind === "numeric" ? 32 : 56}
                          className={col.kind === "numeric" ? "ml-auto" : undefined}
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? (event) => activate(row, event) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter") activate(row, event);
                        }
                      : undefined
                  }
                  className={cn(
                    "relative border-border hover:bg-bg-inset/70",
                    onRowClick &&
                      "cursor-pointer focus-visible:bg-bg-inset/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                    "max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-4 max-md:gap-y-2 max-md:px-4 max-md:py-3.5",
                  )}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={cn(
                        "px-4 py-3 whitespace-normal",
                        col.kind === "numeric" && "text-right font-mono tabular-nums text-fg",
                        col.kind === "primary" && "max-md:w-full max-md:pr-10",
                        col.kind === "action" && "w-12 text-right max-md:absolute max-md:right-2 max-md:top-2.5",
                        col.className,
                        "max-md:w-auto max-md:p-0 max-md:text-left",
                        col.kind === "primary" && "max-md:pr-10",
                        col.hideOnMobile && "max-md:hidden",
                      )}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </table>
    </div>
  );
}
