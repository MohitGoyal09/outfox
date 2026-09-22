"use client";


import { ExternalLink, Globe, Newspaper, ShieldCheck, SquarePlay, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SourceView } from "./agentChat-model";

const ENGINE_META: Record<string, { label: string; icon: LucideIcon }> = {
  google: { label: "Google Search", icon: Globe },
  google_news: { label: "Google News", icon: Newspaper },
  google_trends: { label: "Google Trends", icon: TrendingUp },
  google_ads_transparency_center: { label: "Ads Transparency", icon: ShieldCheck },
  youtube: { label: "YouTube Search", icon: SquarePlay },
  youtube_video: { label: "YouTube Video", icon: SquarePlay },
};

function engineMeta(engine: string): { label: string; icon: LucideIcon } {
  return ENGINE_META[engine] ?? { label: engine, icon: Globe };
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function groupByEngine(sources: SourceView[]): { engine: string; sources: SourceView[] }[] {
  const byEngine = new Map<string, SourceView[]>();
  for (const source of sources) {
    const group = byEngine.get(source.engine) ?? [];
    group.push(source);
    byEngine.set(source.engine, group);
  }
  return [...byEngine.entries()].map(([engine, list]) => ({ engine, sources: list }));
}

export function SourcesDrawer({ sources }: { sources: SourceView[] }) {
  if (sources.length === 0) return null;
  const groups = groupByEngine(sources);

  return (
    <Sheet>
      <SheetTrigger className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg">
        {`Used ${sources.length} source${sources.length === 1 ? "" : "s"}`}
      </SheetTrigger>
      <SheetContent className="bg-bg-raised">
        <SheetHeader>
          <SheetTitle className="text-fg">Sources</SheetTitle>
          <SheetDescription>Every page this answer&rsquo;s claims are grounded in.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-4">
          {groups.map(({ engine, sources: engineSources }) => {
            const { label, icon: Icon } = engineMeta(engine);
            return (
              <div key={engine}>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-fg-tertiary">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </div>
                <ul className="flex flex-col gap-1">
                  {engineSources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-fg-secondary hover:bg-bg-inset hover:text-fg"
                      >
                        <span className="truncate">{hostnameOf(source.url)}</span>
                        <ExternalLink
                          className="size-3 shrink-0 text-fg-tertiary opacity-0 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
