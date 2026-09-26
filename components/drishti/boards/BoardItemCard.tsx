"use client";


import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "../Button";
import { displayClaimText, periodWindow, shortDate } from "../brands/format";
import { EngineTag, PlatformLogo } from "../brands/PlatformLogo";
import { hookName, measureName, sourceName } from "../labels";
import { VALUE_CLASS, iconProps, sourceColor } from "../tokens";
import { boardItemThreadHref } from "./boards-model";

export type BoardItem = FunctionReturnType<typeof api.boards.listItems>[number];

export function BoardItemCard({ item, onRemove }: { item: BoardItem; onRemove: () => Promise<void> | void }) {
  const claim = item.claim;

  if (claim === null) {
    return (
      <article className="flex flex-col gap-3 rounded-lg border border-dashed border-border-strong bg-bg-inset p-4">
        <p className="text-[13px] leading-5 text-fg-secondary">
          This evidence no longer exists. The finding was deleted, or its brand was removed.
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>Saved {shortDate(item.createdAt)}</span>
          <button
            type="button"
            onClick={() => void onRemove()}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            <X {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            Remove
          </button>
        </div>
      </article>
    );
  }

  const accent = sourceColor(claim.sourceEngine);
  const windowLabel = periodWindow(claim.period);

  return (
    <article
      className="group flex flex-col rounded-lg border border-border bg-bg-raised p-4 shadow-xs transition-[border-color,box-shadow] duration-150 ease-out hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-[11px] font-semibold"
          style={{ color: accent, backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)` }}
        >
          <PlatformLogo engine={claim.sourceEngine} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-fg">{sourceName(claim.sourceEngine)}</p>
          <p className={cn(VALUE_CLASS, "mt-0.5 text-[11px] text-fg-tertiary")}>Saved {shortDate(item.createdAt)}</p>
        </div>
        <button
          type="button"
          aria-label="Remove from board"
          onClick={() => void onRemove()}
          className={cn(
            buttonClasses({ variant: "ghost", size: "sm" }),
            "w-7 px-0 text-fg-tertiary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100",
          )}
        >
          <X {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
        </button>
      </div>

      <a
        href={claim.evidenceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-3 line-clamp-3 text-[14px] font-semibold leading-5 text-fg hover:text-accent"
      >
        {displayClaimText(claim.text)}
      </a>

      {claim.metric ? (
        <p className={cn(VALUE_CLASS, "mt-2 text-[11px] text-fg-tertiary")}>
          {measureName(claim.metric)}
          {claim.value !== undefined ? ` · ${String(claim.value)}${claim.unit ? ` ${claim.unit}` : ""}` : ""}
          {windowLabel ? ` · ${windowLabel}` : ""}
        </p>
      ) : null}

      <SavedContext context={item.context} threadExists={item.threadExists} />

      {item.note ? (
        <p className="mt-1.5 text-[12px] leading-5 text-fg-secondary">
          your note: <span className="italic">{item.note}</span>
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        {claim.hookType ? (
          <Badge variant="outline" className="h-6 max-w-[140px] truncate rounded-full px-2 text-[10px] text-fg-secondary">
            {hookName(claim.hookType)}
          </Badge>
        ) : (
          <EngineTag engine={claim.sourceEngine} />
        )}
        <a
          href={claim.evidenceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(buttonClasses({ variant: "ghost", size: "sm" }), "ml-auto")}
        >
          View
          <ArrowUpRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
        </a>
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
      <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-fg-secondary">
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
    return <p className={cn(VALUE_CLASS, "mt-2 text-[11px] text-fg-tertiary")}>saved from: {context.pageLabel}</p>;
  }

  return null;
}