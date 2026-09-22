"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import Link from "next/link";
import { Tag } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../EmptyState";
import { iconProps } from "../tokens";

export function SimilarBrandsPanel() {
  const params = useParams<{ brandId: string }>();
  const brandId = params.brandId as Id<"brands"> | undefined;
  const similar = useQuery(api.brands.similarBrands, brandId ? { brandId } : "skip");

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border/70">
        <Tag className="size-4 text-accent" />
        <CardTitle className="text-sm">Similar brands</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {similar === undefined ? (
          <Skeleton className="h-9 w-full rounded-lg" />
        ) : similar.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Tag {...iconProps} size={16} />}
            title="No other tracked brand shares this vertical."
            description="Fills in once you track another brand with the same vertical as this one — a real shared field, never a computed similarity score."
          />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {similar.map((row) => (
              <li key={String(row._id)}>
                <Link
                  href={`/brands/${row._id}`}
                  className="flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs transition-colors hover:bg-muted/40"
                >
                  <span className="font-medium text-foreground">{row.name}</span>
                  <span className="text-muted-foreground">{row.domain}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
