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
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { SaveAllToBoardButton } from "../boards/SaveAllToBoardButton";
import type { BoardItemContext } from "../boards/boards-model";
import { PlatformLogo } from "../brands/PlatformLogo";
import { CLEAR_OVERLAY_CLASS, STATE_TRANSITION_CLASS } from "../tokens";
import type { ClaimTextById, SourceRowView } from "./agentChat-model";
import { SourcesDrawerContent } from "./SourcesDrawer";

const MAX_AVATARS = 4;

export function AnswerSourcesPanel({
  sources,
  claimsById,
  question = null,
  threadKey = "",
}: {
  sources: SourceRowView[];
  claimsById: ClaimTextById;
  question?: string | null;
  threadKey?: string;
}) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;

  const storedClaimIds = sources
    .filter((source) => claimsById.has(source.claimId))
    .map((source) => source.claimId as Id<"claims">);
  const context: BoardItemContext | undefined =
    question !== null && question !== "" ? { question, ...(threadKey !== "" ? { threadKey } : {}) } : undefined;

  const avatarEngines = [...new Set(sources.map((s) => s.engine))].slice(0, MAX_AVATARS);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          "flex w-fit items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-xs text-fg-secondary",
          STATE_TRANSITION_CLASS,
          "hover:bg-bg-inset hover:text-fg",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "active:translate-y-[0.5px]",
        )}
      >
        <span className="flex items-center -space-x-1" aria-hidden="true">
          {avatarEngines.map((engine) => (
            <span
              key={engine}
              className="flex size-4 items-center justify-center rounded-full bg-bg-raised ring-2 ring-bg"
            >
              <PlatformLogo engine={engine} className="size-3" />
            </span>
          ))}
        </span>
        <span>
          {sources.length} source{sources.length === 1 ? "" : "s"}
        </span>
        <ChevronDown aria-hidden="true" className="size-3 text-fg-tertiary" />
      </SheetTrigger>
      <SheetContent className="bg-bg-raised" overlayClassName={CLEAR_OVERLAY_CLASS}>
        <SheetHeader>
          <SheetTitle className="text-fg">Sources</SheetTitle>
          <SheetDescription>Every finding this answer cited, grouped by source.</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <SaveAllToBoardButton claimIds={storedClaimIds} totalCount={sources.length} context={context} />
        </div>
        <SourcesDrawerContent rows={sources} claimsById={claimsById} />
      </SheetContent>
    </Sheet>
  );
}
