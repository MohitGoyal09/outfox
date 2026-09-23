"use client";


import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import type { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sourceAccent } from "../brands/EvidenceCard";
import { engineLabel } from "../brands/brand-model";
import { displayClaimText, periodWindow, shortDate } from "../brands/format";
import { EngineTag, PlatformLogo } from "../brands/PlatformLogo";
import { boardItemThreadHref } from "./boards-model";

export type BoardItem = FunctionReturnType<typeof api.boards.listItems>[number];

export function BoardItemCard({ item, onRemove }: { item: BoardItem; onRemove: () => Promise<void> | void }) {
  const claim = item.claim;

  if (claim === null) {
    return (
      <article className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4">
        <p className="text-[13px] leading-5 text-muted-foreground">
          This evidence no longer exists. The claim was deleted, or its brand was removed.
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">Saved {shortDate(item.createdAt)}</span>
          <Button variant="ghost" size="sm" onClick={() => void onRemove()} className="gap-1 text-muted-foreground">
            <X className="size-3.5" /> Remove
          </Button>
        </div>
      </article>
    );
  }

  const accent = sourceAccent[claim.sourceEngine] ?? "#0f766e";
  const windowLabel = periodWindow(claim.period);

  return (
    <article className="group flex flex-col rounded-xl border border-border border-t-2 bg-card p-4 transition-colors hover:border-accent/50 hover:bg-accent/[0.02]" style={{ borderTopColor: accent }}>
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-[11px] font-semibold"
          style={{ color: accent, backgroundColor: `${accent}1a` }}
        >
          <PlatformLogo engine={claim.sourceEngine} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-foreground">{engineLabel(claim.sourceEngine)}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">Saved {shortDate(item.createdAt)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove from board"
          onClick={() => void onRemove()}
          className="text-muted-foreground opacity-0 group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <a
        href={claim.evidenceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-3 line-clamp-3 text-[14px] font-semibold leading-5 text-foreground hover:text-accent"
      >
        {displayClaimText(claim.text)}
      </a>

      {claim.metric ? (
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {claim.metric}
          {claim.value !== undefined ? ` · ${String(claim.value)}${claim.unit ? ` ${claim.unit}` : ""}` : ""}
          {windowLabel ? ` · ${windowLabel}` : ""}
        </p>
      ) : null}

      <SavedContext context={item.context} threadExists={item.threadExists} />

      {item.note ? (
        <p className="mt-1.5 text-[12px] leading-5 text-muted-foreground">
          your note: <span className="italic">{item.note}</span>
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3">
        {claim.hookType ? (
          <Badge variant="outline" className="h-6 max-w-[140px] truncate rounded-full px-2 text-[10px] text-muted-foreground">
            {claim.hookType.replaceAll("_", " ")}
          </Badge>
        ) : (
          <EngineTag engine={claim.sourceEngine} />
        )}
        <Button asChild variant="outline" size="sm" className="ml-auto h-7 rounded-md px-2 text-[11px]">
          <a href={claim.evidenceUrl} target="_blank" rel="noreferrer noopener">
            View <ArrowUpRight className="ml-1 size-3" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function SavedContext({
  context,
  threadExists,
}: {
  context: BoardItem["context"];
  threadExists: boolean;
}) {
  if (context === undefined) return null;

  if (context.question !== undefined && context.question !== "") {
    const canLink = context.threadKey !== undefined && threadExists;
    return (
      <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-muted-foreground">
        saved while asking:{" "}
        {canLink ? (
          <Link href={boardItemThreadHref(context.threadKey as string)} className="italic underline decoration-dotted hover:text-accent">
            &ldquo;{context.question}&rdquo;
          </Link>
        ) : (
          <span className="italic">&ldquo;{context.question}&rdquo;</span>
        )}
      </p>
    );
  }

  if (context.pageLabel !== undefined && context.pageLabel !== "") {
    return <p className="mt-2 font-mono text-[11px] text-muted-foreground">saved from: {context.pageLabel}</p>;
  }

  return null;
}
