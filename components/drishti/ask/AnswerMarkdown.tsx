"use client";


import { useReducedMotion } from "motion/react";
import { MessageResponse } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { engineDomain } from "./agentChat-model";
import type { SourceView } from "./agentChat-model";
import { engineGlyph } from "./SourcesDrawer";

const CLAIM_LINK_HREF_RE = /\]\(claim:([^)\s]+)\)/g;
const CLAIM_HASH_PREFIX = "#claim-";

function toHashHref(markdown: string): string {
  return markdown.replace(CLAIM_LINK_HREF_RE, (_match, id: string) => `](${CLAIM_HASH_PREFIX}${encodeURIComponent(id)})`);
}

function claimIdFromHref(href: string): string | null {
  if (!href.startsWith(CLAIM_HASH_PREFIX)) return null;
  return decodeURIComponent(href.slice(CLAIM_HASH_PREFIX.length));
}

function numberLabelOf(children: unknown): string {
  return typeof children === "string" ? children : "#";
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

  return (
    <MessageResponse
      mode={isStreaming ? "streaming" : "static"}
      isAnimating={isStreaming}
      animated={animate ? { animation: "fadeIn", duration: 250, stagger: 80, sep: "word" } : false}
      caret={isStreaming && !reduceMotion ? "block" : undefined}
      components={{
        a: (props) => {
          const href = typeof props.href === "string" ? props.href : "";
          const claimId = claimIdFromHref(href);
          if (claimId === null) {
            return <a {...props} target="_blank" rel="noreferrer noopener" />;
          }
          const source = citationSources.get(claimId);
          const Icon = source !== undefined ? engineGlyph(source.engine) : null;
          const label = source !== undefined ? engineDomain(source.engine, source.url) : numberLabelOf(props.children);
          return (
            <button
              type="button"
              onClick={() => onOpenCitation(claimId)}
              title={source !== undefined ? `${source.engine} · view the evidence behind this` : "View the evidence behind this"}
              className={cn(
                "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200",
                "inline-flex h-[18px] cursor-pointer items-center gap-1 rounded-[5px] border border-border bg-bg-inset pl-[3px] pr-1.5 align-baseline font-mono text-[10.5px] text-fg-secondary shadow-[var(--shadow-lift)] transition-colors duration-150 ease-out hover:bg-bg-raised-2 hover:text-fg",
              )}
            >
              {Icon !== null ? <Icon className="size-[9px] shrink-0" aria-hidden="true" /> : null}
              {label}
            </button>
          );
        },
        table: (props) => (
          <div className="my-2 overflow-x-auto rounded-[8px] border border-border">
            <table {...props} className={cn(props.className, "w-full tabular-nums")} />
          </div>
        ),
        td: (props) => <td {...props} className={cn(props.className, "tabular-nums")} />,
        th: (props) => <th {...props} className={cn(props.className, "tabular-nums")} />,
      }}
    >
      {toHashHref(text)}
    </MessageResponse>
  );
}

