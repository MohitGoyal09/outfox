"use client";


import { ArrowUpRight, Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";
import { Panel } from "../Panel";
import { iconProps } from "../tokens";

export type NarrativeCitation = { href: string; label?: string };

export type NarrativeBullet = {
  text: string;
  citation?: NarrativeCitation | null;
};

export type NarrativeBlockProps = {
  headline: string;
  headlineCitation?: NarrativeCitation | null;
  bullets?: readonly NarrativeBullet[];
  className?: string;
};

function CitationChip({ citation }: { citation: NarrativeCitation }) {
  return (
    <a
      href={citation.href}
      target="_blank"
      rel="noreferrer noopener"
      className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-border bg-bg-inset px-1.5 py-px align-middle text-[10.5px] font-medium text-fg-secondary transition-colors duration-150 ease-out hover:border-border-strong hover:text-fg"
    >
      {citation.label ?? "Source"}
      <ArrowUpRight {...iconProps} size={12} aria-hidden="true" className="size-3" />
    </a>
  );
}

export function NarrativeBlock({
  headline,
  headlineCitation = null,
  bullets = [],
  className,
}: NarrativeBlockProps) {
  const lead = headline.trim();
  const support = bullets.filter((bullet) => bullet.text.trim().length > 0);
  if (lead.length === 0 && support.length === 0) return null;

  return (
    <Panel
      interactive={false}
      ariaLabel="What this means"
      className={cn(
        "border-[color-mix(in_srgb,var(--narrative)_30%,var(--border))] p-4",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--narrative)_12%,transparent)] text-[var(--narrative)]"
        >
          <Lightbulb {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-fg-tertiary">
            What this means
          </p>
          {lead.length > 0 ? (
            <p className="mt-1 text-[14px] font-medium leading-[1.45] tracking-[-0.01em] text-fg">
              {lead}
              {headlineCitation ? <CitationChip citation={headlineCitation} /> : null}
            </p>
          ) : null}
          {support.length > 0 ? (
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {support.map((bullet, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-[13px] leading-[1.5] text-fg-secondary"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.6em] size-1 shrink-0 rounded-full bg-border-strong"
                  />
                  <span className="min-w-0">
                    {bullet.text}
                    {bullet.citation ? <CitationChip citation={bullet.citation} /> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
