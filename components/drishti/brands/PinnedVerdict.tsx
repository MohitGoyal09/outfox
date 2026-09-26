"use client";


import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Panel } from "../Panel";
import { iconProps } from "../tokens";
import type { PinnedVerdictState } from "./narrative-model";

const COLLAPSED_STORAGE_KEY = "drishti:pinned-verdict:collapsed";

function readStoredCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
  }
}

function CitationChip({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-border bg-bg-inset px-1.5 py-px align-middle text-[10.5px] font-medium text-fg-secondary transition-colors duration-150 ease-out hover:border-border-strong hover:text-fg"
    >
      {label ?? "Source"}
    </a>
  );
}

export function PinnedVerdict({ state, className }: { state: PinnedVerdictState | null; className?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setCollapsed(readStoredCollapsed()), []);

  if (state === null) return null;

  const failed = state.kind === "failed";

  return (
    <Collapsible
      open={!collapsed}
      onOpenChange={(open) => {
        setCollapsed(!open);
        writeStoredCollapsed(!open);
      }}
      className={className}
    >
      <Panel
        interactive={false}
        ariaLabel={failed ? "Brand DNA read failed" : "Brand verdict"}
        className={cn(
          "p-4",
          failed
            ? "border-danger/30 bg-danger/[0.03]"
            : "border-[color-mix(in_srgb,var(--narrative)_30%,var(--border))]",
        )}
      >
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
              failed ? "bg-danger/10 text-danger" : "bg-[color-mix(in_srgb,var(--narrative)_12%,transparent)] text-[var(--narrative)]",
            )}
          >
            {failed ? (
              <AlertTriangle {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            ) : (
              <Lightbulb {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-fg-tertiary">
                {failed ? "Brand DNA read failed" : "What this means"}
              </p>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-fg"
                >
                  {collapsed ? "Show" : "Hide"}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("size-3.5 transition-transform duration-150 ease-out", !collapsed && "rotate-180")}
                  />
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              {failed ? (
                <p className="mt-1 text-[13px] leading-[1.5] text-fg-secondary">
                  {state.failureReason ?? "No reason was recorded for the failure."}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-[14px] font-medium leading-[1.45] tracking-[-0.01em] text-fg">
                    {state.headline}
                    {state.headlineCitation ? <CitationChip href={state.headlineCitation.href} label={state.headlineCitation.label} /> : null}
                  </p>
                  {state.provenance ? (
                    <p className="mt-1.5 text-[11.5px] leading-[1.5] text-muted-foreground">
                      {state.provenance}
                      {state.provenanceCitation ? (
                        <CitationChip href={state.provenanceCitation.href} label={state.provenanceCitation.label} />
                      ) : null}
                    </p>
                  ) : null}
                </>
              )}
            </CollapsibleContent>
          </div>
        </div>
      </Panel>
    </Collapsible>
  );
}
