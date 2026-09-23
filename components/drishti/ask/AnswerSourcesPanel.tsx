"use client";


import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { STATE_TRANSITION_CLASS } from "../tokens";
import type { SourceRowView } from "./agentChat-model";
import { engineGlyph, engineHue, SourcesDrawerContent } from "./SourcesDrawer";

const MAX_AVATARS = 4;

export function AnswerSourcesPanel({ sources }: { sources: SourceRowView[] }) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;

  const avatarEngines = [...new Set(sources.map((s) => s.engine))].slice(0, MAX_AVATARS);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          "flex w-fit items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-xs text-fg-secondary",
          STATE_TRANSITION_CLASS,
          "hover:bg-bg-inset hover:text-fg",
        )}
      >
        <span className="flex items-center -space-x-1" aria-hidden="true">
          {avatarEngines.map((engine) => {
            const Icon = engineGlyph(engine);
            const hue = engineHue(engine);
            return (
              <span
                key={engine}
                className="flex size-3.5 items-center justify-center rounded-full ring-2 ring-bg"
                style={{ backgroundColor: `color-mix(in srgb, ${hue} 18%, transparent)`, color: hue }}
              >
                <Icon className="size-2.5" />
              </span>
            );
          })}
        </span>
        <span>
          {sources.length} source{sources.length === 1 ? "" : "s"}
        </span>
        <ChevronDown aria-hidden="true" className="size-3 text-fg-tertiary" />
      </SheetTrigger>
      <SheetContent className="bg-bg-raised">
        <SheetHeader>
          <SheetTitle className="text-fg">Sources</SheetTitle>
          <SheetDescription>Every claim this answer cited, grouped by engine.</SheetDescription>
        </SheetHeader>
        <SourcesDrawerContent rows={sources} />
      </SheetContent>
    </Sheet>
  );
}
