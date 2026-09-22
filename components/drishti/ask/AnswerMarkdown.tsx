"use client";


import type { ReactNode } from "react";
import { MessageResponse } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { Chip } from "../Chip";
import type { SourceView } from "./agentChat-model";

const CLAIM_LINK_HREF_RE = /\]\(claim:([^)\s]+)\)/g;
const CLAIM_HASH_PREFIX = "#claim-";

function toHashHref(markdown: string): string {
  return markdown.replace(CLAIM_LINK_HREF_RE, (_match, id: string) => `](${CLAIM_HASH_PREFIX}${encodeURIComponent(id)})`);
}

function claimIdFromHref(href: string): string | null {
  if (!href.startsWith(CLAIM_HASH_PREFIX)) return null;
  return decodeURIComponent(href.slice(CLAIM_HASH_PREFIX.length));
}

function labelOf(children: ReactNode): string {
  return typeof children === "string" ? children : "•";
}

export function AnswerMarkdown({
  text,
  citationSources,
}: {
  text: string;
  citationSources: Map<string, SourceView>;
}) {
  return (
    <MessageResponse
      components={{
        a: (props) => {
          const href = typeof props.href === "string" ? props.href : "";
          const claimId = claimIdFromHref(href);
          if (claimId === null) {
            return <a {...props} target="_blank" rel="noreferrer noopener" />;
          }
          const source = citationSources.get(claimId);
          return (
            <Chip
              size="sm"
              href={source?.url}
              title={
                source !== undefined
                  ? `${source.engine} · opens the source`
                  : "Evidence link not resolved for this citation yet"
              }
            >
              {labelOf(props.children)}
            </Chip>
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

