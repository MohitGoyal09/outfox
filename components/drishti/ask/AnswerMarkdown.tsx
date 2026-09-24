"use client";


import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { MessageResponse } from "@/components/ai-elements/message";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { sourceName } from "@/components/drishti/labels";
import { collapseAdjacentSameHostCitations, engineDomain } from "./agentChat-model";
import type { SourceView } from "./agentChat-model";
import { engineGlyph, engineHue } from "./SourcesDrawer";

const CLAIM_LINK_HREF_RE = /\]\(claim:([^)\s]+)\)/g;
const CLAIMSET_LINK_HREF_RE = /\]\(claimset:([^)\s]+)\)/g;
const CLAIM_HASH_PREFIX = "#claim-";
const CLAIMSET_HASH_PREFIX = "#claims-";

const BACKTICKED_CITATION_RE = /`((?:\[\d+\]\(claim:[^)\s]+\)[ \t]*,?[ \t]*)+)`/g;
function stripCitationCodeFences(markdown: string): string {
  return markdown.replace(BACKTICKED_CITATION_RE, (_match, inner: string) => inner);
}

function toHashHref(markdown: string): string {
  return markdown
    .replace(CLAIMSET_LINK_HREF_RE, (_match, pairs: string) => `](${CLAIMSET_HASH_PREFIX}${pairs})`)
    .replace(CLAIM_LINK_HREF_RE, (_match, id: string) => `](${CLAIM_HASH_PREFIX}${encodeURIComponent(id)})`);
}

function claimIdFromHref(href: string): string | null {
  if (!href.startsWith(CLAIM_HASH_PREFIX)) return null;
  return decodeURIComponent(href.slice(CLAIM_HASH_PREFIX.length));
}

function claimSetFromHref(href: string): { n: string; claimId: string }[] | null {
  if (!href.startsWith(CLAIMSET_HASH_PREFIX)) return null;
  return href
    .slice(CLAIMSET_HASH_PREFIX.length)
    .split(",")
    .map((pair) => {
      const [n, claimId] = pair.split(":");
      return { n: n ?? "#", claimId: claimId ?? "" };
    })
    .filter((entry) => entry.claimId !== "");
}

function numberLabelOf(children: unknown): string {
  return typeof children === "string" ? children : "#";
}

const CHIP_CLASS =
  "inline-flex h-[18px] cursor-pointer items-center gap-1 rounded-[5px] border border-border bg-bg-inset pl-[3px] pr-1.5 align-baseline font-mono text-[10.5px] text-fg-secondary shadow-[var(--shadow-lift)] transition-colors duration-150 ease-out hover:bg-bg-raised-2 hover:text-fg";

function CitationChip({
  claimId,
  fallbackLabel,
  source,
  onOpenCitation,
  animateIn = false,
}: {
  claimId: string;
  fallbackLabel: string;
  source: SourceView | undefined;
  onOpenCitation: (claimId: string) => void;
  animateIn?: boolean;
}) {
  const label = source !== undefined ? engineDomain(source.engine, source.url) : fallbackLabel;
  return (
    <button
      type="button"
      onClick={() => onOpenCitation(claimId)}
      title={source !== undefined ? `${sourceName(source.engine)} · view the evidence behind this` : "View the evidence behind this"}
      className={cn(
        animateIn && "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200",
        CHIP_CLASS,
      )}
    >
      {source !== undefined
        ? (() => {
            const Icon = engineGlyph(source.engine);
            return <Icon className="size-[9px] shrink-0" style={{ color: engineHue(source.engine) }} aria-hidden="true" />;
          })()
        : null}
      {label}
    </button>
  );
}

function MergedCitationChip({
  entries,
  citationSources,
  onOpenCitation,
}: {
  entries: { n: string; claimId: string }[];
  citationSources: Map<string, SourceView>;
  onOpenCitation: (claimId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const firstSource = citationSources.get(entries[0]?.claimId ?? "");
  const host = firstSource !== undefined ? engineDomain(firstSource.engine, firstSource.url) : "sources";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`${entries.length} citations from ${host} · view them`}
          className={cn(
            "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200",
            CHIP_CLASS,
          )}
        >
          {firstSource !== undefined
            ? (() => {
                const Icon = engineGlyph(firstSource.engine);
                return <Icon className="size-[9px] shrink-0" style={{ color: engineHue(firstSource.engine) }} aria-hidden="true" />;
              })()
            : null}
          {host}
          <span className="tabular-nums">×{entries.length}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-0 border border-border bg-bg-raised p-1.5 shadow-[var(--shadow-drawer)]">
        <div className="flex flex-col gap-1">
          {entries.map((entry) => (
            <CitationChip
              key={entry.claimId}
              claimId={entry.claimId}
              fallbackLabel={entry.n}
              source={citationSources.get(entry.claimId)}
              onOpenCitation={(claimId) => {
                setOpen(false);
                onOpenCitation(claimId);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AnswerMarkdown({
  text,
  citationSources,
  isStreaming = false,
  onOpenCitation,
}: {
  text: string;
  citationSources: Map<string, SourceView>;
  isStreaming?: boolean;
  onOpenCitation: (claimId: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const animate = isStreaming && !reduceMotion;
  const renderedText = toHashHref(
    collapseAdjacentSameHostCitations(stripCitationCodeFences(text), citationSources),
  );

  return (
    <MessageResponse
      mode={isStreaming ? "streaming" : "static"}
      isAnimating={isStreaming}
      animated={animate ? { animation: "fadeIn", duration: 250, stagger: 80, sep: "word" } : false}
      caret={isStreaming && !reduceMotion ? "block" : undefined}
      components={{
        a: (props) => {
          const href = typeof props.href === "string" ? props.href : "";
          const claimSet = claimSetFromHref(href);
          if (claimSet !== null) {
            return (
              <MergedCitationChip entries={claimSet} citationSources={citationSources} onOpenCitation={onOpenCitation} />
            );
          }
          const claimId = claimIdFromHref(href);
          if (claimId === null) {
            return <a {...props} target="_blank" rel="noreferrer noopener" />;
          }
          return (
            <CitationChip
              claimId={claimId}
              fallbackLabel={numberLabelOf(props.children)}
              source={citationSources.get(claimId)}
              onOpenCitation={onOpenCitation}
              animateIn
            />
          );
        },
        table: (props) => (
          <div className="my-2 w-0 min-w-full overflow-x-auto rounded-[8px] border border-border">
            <table {...props} className={cn(props.className, "w-full tabular-nums")} />
          </div>
        ),
        td: (props) => <td {...props} className={cn(props.className, "tabular-nums")} />,
        th: (props) => <th {...props} className={cn(props.className, "tabular-nums")} />,
      }}
    >
      {renderedText}
    </MessageResponse>
  );
}

