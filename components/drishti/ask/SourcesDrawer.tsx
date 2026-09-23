"use client";


import { ExternalLink, Globe, Newspaper, ShieldCheck, SquarePlay, Tags, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

const ENGINE_META: Record<SourceEngine, { label: string; icon: LucideIcon }> = {
  google: { label: "Google Search", icon: Globe },
  google_news: { label: "Google News", icon: Newspaper },
  google_trends: { label: "Google Trends", icon: TrendingUp },
  google_ads_transparency_center: { label: "Ads Transparency", icon: ShieldCheck },
  youtube: { label: "YouTube Search", icon: SquarePlay },
  youtube_video: { label: "YouTube Video", icon: SquarePlay },
  llm_tag: { label: "content tags", icon: Tags },
};

export const ENGINE_HUE: Record<SourceEngine, string> = {
  google: "#6366F1", // indigo
  google_news: "#EA580C", // burnt orange
  google_trends: "#16A34A", // green
  google_ads_transparency_center: "#C026D3", // fuchsia
  youtube: "#9D174D", // wine
  youtube_video: "#92400E", // brown
  llm_tag: "#475569", // slate -- the one engine that isn't a live fetch
};

function isSourceEngine(engine: string): engine is SourceEngine {
  return Object.prototype.hasOwnProperty.call(ENGINE_META, engine);
}

function engineMeta(engine: string): { label: string; icon: LucideIcon } {
  return isSourceEngine(engine) ? ENGINE_META[engine] : { label: engine, icon: Globe };
}

export function engineHue(engine: string): string {
  return isSourceEngine(engine) ? ENGINE_HUE[engine] : "var(--text-tertiary, #98A2B3)";
}

export function engineGlyph(engine: string): LucideIcon {
  return engineMeta(engine).icon;
}

export type EngineGroup = { engine: string; rows: SourceRowView[] };

export function groupSourcesByEngine(rows: SourceRowView[]): EngineGroup[] {
  const byEngine = new Map<string, SourceRowView[]>();
  for (const row of rows) {
    const group = byEngine.get(row.engine) ?? [];
    group.push(row);
    byEngine.set(row.engine, group);
  }
  return [...byEngine.entries()].map(([engine, groupRows]) => ({ engine, rows: groupRows }));
}

function SourceRow({ row, isStoredClaim }: { row: SourceRowView; isStoredClaim: boolean }) {
  return (
    <div className="group flex items-start gap-1 rounded-[6px] px-2 py-2 transition-colors duration-150 ease-out hover:bg-bg-inset">
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 flex-col gap-1"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-[1.45] text-fg">
            {row.text !== "" ? row.text : "This claim is not in the current scope's view."}
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
        const { label, icon: Icon } = engineMeta(engine);
        const hue = engineHue(engine);
        return (
          <div key={engine}>
            <div className="mb-1.5 flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="flex size-4 items-center justify-center rounded-full"
                style={{ backgroundColor: `color-mix(in srgb, ${hue} 16%, transparent)`, color: hue }}
              >
                <Icon className="size-2.5" />
              </span>
              <span className="text-xs font-semibold text-fg-secondary">
                {label} · {engineRows.length}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-[8px] border border-border bg-bg-inset p-1">
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
      <SheetTrigger className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg">
        {`Used ${rows.length} source${rows.length === 1 ? "" : "s"}`}
      </SheetTrigger>
      <SheetContent className="bg-bg-raised">
        <SheetHeader>
          <SheetTitle className="text-fg">Sources</SheetTitle>
          <SheetDescription>Every page this answer&rsquo;s claims are grounded in.</SheetDescription>
        </SheetHeader>
        <SourcesDrawerContent rows={rows} claimsById={claimsById} />
      </SheetContent>
    </Sheet>
  );
}
