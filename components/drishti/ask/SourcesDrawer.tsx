"use client";


import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { sourceKey, sourceName } from "@/components/drishti/labels";
import { displayClaimText } from "@/components/drishti/brands/format";
import { PlatformLogo } from "../brands/PlatformLogo";
import { SaveToBoardButton } from "../boards/SaveToBoardButton";
import { LABEL_CLASS, VALUE_CLASS } from "../tokens";
import { formatFetchedAt, hostnameOf } from "./agentChat-model";
import type { ClaimTextById, SourceRowView } from "./agentChat-model";

export const SOURCE_ENGINES = [
  "google",
  "google_news",
  "google_trends",
  "google_ads_transparency_center",
  "youtube",
  "youtube_video",
  "llm_tag",
] as const;

export type SourceEngine = (typeof SOURCE_ENGINES)[number];

export type EngineGroup = { engine: string; rows: SourceRowView[] };

export function groupSourcesByEngine(rows: SourceRowView[]): EngineGroup[] {
  const byEngine = new Map<string, SourceRowView[]>();
  for (const row of rows) {
    const key = sourceKey(row.engine);
    const group = byEngine.get(key) ?? [];
    group.push(row);
    byEngine.set(key, group);
  }
  return [...byEngine.entries()].map(([engine, groupRows]) => ({ engine, rows: groupRows }));
}

function SourceRow({ row, isStoredClaim }: { row: SourceRowView; isStoredClaim: boolean }) {
  return (
    <div className="group flex items-start gap-2 rounded-sm px-2 py-2.5 transition-colors duration-150 ease-out hover:bg-bg-raised">
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 flex-col gap-1.5"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-[1.45] text-fg">
            {row.text !== "" ? displayClaimText(row.text) : "This citation isn't part of what's currently in view."}
          </p>
          <ExternalLink
            className="mt-0.5 size-3 shrink-0 text-fg-tertiary opacity-0 group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(LABEL_CLASS, "normal-case tracking-normal text-fg-tertiary")}>
            {hostnameOf(row.url)}
          </span>
          <span aria-hidden="true" className="text-fg-tertiary">
            ·
          </span>
          <span className={cn(VALUE_CLASS, "text-[11px] text-fg-tertiary")}>
            {formatFetchedAt(row.fetchedAt)}
          </span>
        </div>
      </a>
      {isStoredClaim ? (
        <SaveToBoardButton
          claimId={row.claimId as Id<"claims">}
          variant="icon"
          className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        />
      ) : null}
    </div>
  );
}

export function SourcesDrawerContent({ rows, claimsById }: { rows: SourceRowView[]; claimsById: ClaimTextById }) {
  const groups = groupSourcesByEngine(rows);
  return (
    <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-4">
      {groups.map(({ engine, rows: engineRows }) => {
        const label = sourceName(engine);
        return (
          <div key={engine}>
            <div className="mb-2 flex items-center gap-2">
              <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
                <PlatformLogo engine={engine} className="size-3.5" />
              </span>
              <span className="text-xs font-semibold text-fg-secondary">
                {label} · {engineRows.length}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-bg-inset p-1">
              {engineRows.map((row) => (
                <SourceRow key={row.claimId} row={row} isStoredClaim={claimsById.has(row.claimId)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SourcesDrawer({ rows, claimsById }: { rows: SourceRowView[]; claimsById: ClaimTextById }) {
  if (rows.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-bg-raised px-3 py-1.5 text-xs font-medium text-fg-secondary transition-colors duration-150 ease-out hover:border-border-strong hover:bg-bg-inset hover:text-fg">
        {`Used ${rows.length} source${rows.length === 1 ? "" : "s"}`}
      </SheetTrigger>
      <SheetContent className="bg-bg-raised">
        <SheetHeader>
          <SheetTitle className="text-fg">Sources</SheetTitle>
          <SheetDescription>Every page this answer&rsquo;s findings are grounded in.</SheetDescription>
        </SheetHeader>
        <SourcesDrawerContent rows={rows} claimsById={claimsById} />
      </SheetContent>
    </Sheet>
  );
}
