"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Tag } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SimilarBrandsPanel({ brandId }: { brandId: Id<"brands"> }) {
  const similar = useQuery(api.brands.similarBrands, { brandId });
  if (similar === undefined || similar.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          asChild
          variant="outline"
          className="h-7 cursor-pointer gap-0 rounded-full px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
        >
          <button type="button" aria-label={`${similar.length} similar brand${similar.length === 1 ? "" : "s"}, open list`}>
            <Tag className="mr-1.5 size-3.5" />
            {Intl.NumberFormat("en-US").format(similar.length)} similar brand{similar.length === 1 ? "" : "s"}
          </button>
        </Badge>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="mb-2 px-0.5 text-xs leading-4 text-muted-foreground">
          Other tracked brands in the same vertical, a real shared field, never a similarity score.
        </p>
        <ul className="flex flex-col gap-0.5">
          {similar.map((row) => (
            <li key={String(row._id)}>
              <Link
                href={`/brands/${row._id}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <span className="min-w-0 truncate font-medium text-foreground">{row.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{row.domain}</span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
