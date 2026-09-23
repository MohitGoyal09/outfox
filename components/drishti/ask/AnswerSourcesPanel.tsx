"use client";


import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_CLASS, STATE_TRANSITION_CLASS } from "../tokens";
import { engineLabel } from "./ask-model";
import { hostnameOf, type SourceView } from "./agentChat-model";
import { engineGlyph } from "./SourcesDrawer";

const MAX_AVATARS = 4;

export function AnswerSourcesPanel({ sources }: { sources: SourceView[] }) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;

  const avatarEngines = [...new Set(sources.map((s) => s.engine))].slice(0, MAX_AVATARS);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-fit items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-xs text-fg-secondary",
          STATE_TRANSITION_CLASS,
          "hover:bg-bg-inset hover:text-fg",
        )}
      >
        <span className="flex items-center -space-x-1" aria-hidden="true">
          {avatarEngines.map((engine) => {
            const Icon = engineGlyph(engine);
            return (
              <span
                key={engine}
                className="flex size-3.5 items-center justify-center rounded-full bg-bg-raised text-fg-tertiary ring-2 ring-bg"
              >
                <Icon className="size-2.5" />
              </span>
            );
          })}
        </span>
        <span>
          {sources.length} source{sources.length === 1 ? "" : "s"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-3 text-fg-tertiary transition-transform duration-150 ease-out", open && "rotate-180")}
        />
      </button>

      <div
        className="grid overflow-hidden transition-[grid-template-rows] duration-[220ms] ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-1.5 flex flex-col gap-0.5 rounded-[8px] border border-border bg-bg-inset p-1.5">
            {sources.map((source) => {
              const Icon = engineGlyph(source.engine);
              return (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cn(
                    "flex items-center gap-2 rounded-[6px] px-2 py-1.5",
                    STATE_TRANSITION_CLASS,
                    "hover:bg-bg-raised-2",
                  )}
                >
                  <Icon className="size-3.5 shrink-0 text-fg-tertiary" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-fg">{engineLabel(source.engine)}</span>
                  <span className={cn(LABEL_CLASS, "shrink-0 normal-case tracking-normal text-fg-tertiary")}>
                    {hostnameOf(source.url)}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
