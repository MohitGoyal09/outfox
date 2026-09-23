"use client";


import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { LABEL_CLASS, isValidEvidenceHref } from "../tokens";
import { engineLabel } from "./ask-model";
import { engineGlyph } from "./SourcesDrawer";

function formatFetchedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function CitationDrawer({
  open,
  claim,
  onOpenChange,
}: {
  open: boolean;
  claim: Doc<"claims"> | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-bg-raised">
        <SheetHeader>
          <SheetTitle className="text-fg">Evidence</SheetTitle>
          <SheetDescription>
            {claim !== undefined
              ? "The stored claim this citation points at."
              : "This claim is not in the current scope's view."}
          </SheetDescription>
        </SheetHeader>
        {claim !== undefined ? (
          <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
            <p className="text-sm leading-6 text-fg">{claim.text}</p>

            {claim.value !== undefined ? (
              <div className="flex items-center gap-2">
                <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>Value</span>
                <span className="font-mono tabular-nums text-sm text-fg">
                  {claim.value}
                  {claim.unit !== undefined ? ` ${claim.unit}` : ""}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>Source</span>
              {(() => {
                const Icon = engineGlyph(claim.sourceEngine);
                return <Icon className="size-4 text-fg-tertiary" aria-hidden="true" />;
              })()}
              <span className="text-sm text-fg-secondary">{engineLabel(claim.sourceEngine)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>Fetched</span>
              <span className="font-mono tabular-nums text-sm text-fg-secondary">
                {formatFetchedAt(claim.fetchedAt)}
              </span>
            </div>

            {isValidEvidenceHref(claim.evidenceUrl) ? (
              <a
                href={claim.evidenceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className={cn(
                  "inline-flex w-fit items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 text-sm text-fg-secondary",
                  "transition-colors duration-150 ease-out hover:border-accent/40 hover:text-fg",
                )}
              >
                Open source
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <p className="break-all text-xs text-fg-tertiary">{claim.evidenceUrl}</p>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
