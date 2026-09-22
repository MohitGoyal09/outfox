"use client";


import { motion } from "motion/react";
import { Check, Loader2, Plus } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { BrandMark } from "@/components/drishti/brands/BrandMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type CatalogEntry = Doc<"brandCatalog">;

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function CatalogRow({
  entry,
  followed,
  pending,
  similar,
  reduceMotion,
  onFollow,
  hydrationStatus,
  atCap = false,
}: {
  entry: CatalogEntry;
  followed: boolean;
  pending: boolean;
  similar: CatalogEntry[];
  reduceMotion: boolean;
  onFollow: () => void;
  hydrationStatus?: "hydrating" | "ready";
  atCap?: boolean;
}) {
  return (
    <motion.div
      layout={!reduceMotion}
      whileTap={followed || pending || reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
    >
      <Card
        className={cn(
          "h-full border-border/80 bg-card shadow-none transition-colors",
          followed && "border-accent/35 bg-accent/[0.03]",
        )}
      >
        <CardContent className="flex items-start gap-3 p-4">
          <BrandMark name={entry.name} domain={entry.domain} className="size-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{entry.name}</p>
              <Button
                type="button"
                size="sm"
                variant={followed ? "secondary" : "outline"}
                disabled={pending || followed || atCap}
                onClick={onFollow}
                className="h-7 shrink-0 gap-1.5 px-2.5 text-xs"
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : followed ? (
                  <Check className="size-3.5" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                {followed ? "Following" : pending ? "Following" : "Follow"}
              </Button>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {entry.domain} · {entry.vertical}
            </p>
            {followed && hydrationStatus !== undefined ? (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    hydrationStatus === "ready"
                      ? "bg-emerald-500"
                      : cn("bg-amber-500", !reduceMotion && "animate-pulse"),
                  )}
                />
                {hydrationStatus === "ready" ? "Profile hydrated" : "Hydrating profile…"}
              </p>
            ) : null}
            {entry.description !== undefined ? (
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {entry.description}
              </p>
            ) : null}
            {similar.length > 0 ? (
              <p className="mt-2 truncate text-[11px] text-muted-foreground">
                Also in {entry.vertical}: {similar.map((item) => item.name).join(", ")}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
