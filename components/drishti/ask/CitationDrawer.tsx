"use client";


import { stripEmDashes } from "@/lib/noEmDash";
import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { measureName } from "@/components/drishti/labels";
import type { Id } from "@/convex/_generated/dataModel";
import { SaveToBoardButton } from "../boards/SaveToBoardButton";
import type { BoardItemContext } from "../boards/boards-model";
import { PlatformLogo } from "../brands/PlatformLogo";
import { LABEL_CLASS, isValidEvidenceHref } from "../tokens";
import { formatFetchedAt } from "./agentChat-model";
import { engineLabel } from "./ask-model";

export type EvidenceDetail = {
  text: string;
  value?: string | number;
  unit?: string;
  sourceEngine: string;
  fetchedAt: string;
  evidenceUrl: string;
};

export function CitationDrawer({
  open,
  claim,
  claimId,
  isStoredClaim = false,
  question = null,
  threadKey = "",
  onOpenChange,
}: {
  open: boolean;
  claim: EvidenceDetail | undefined;
  claimId?: Id<"claims"> | null;
  isStoredClaim?: boolean;
  question?: string | null;
  threadKey?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const context: BoardItemContext | undefined =
    question !== null && question !== "" ? { question, ...(threadKey !== "" ? { threadKey } : {}) } : undefined;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-bg-raised">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-fg">Evidence</SheetTitle>
            {claim !== undefined && isStoredClaim && claimId ? (
              <SaveToBoardButton claimId={claimId} variant="labeled" context={context} />
            ) : null}
          </div>
          <SheetDescription>
            {claim !== undefined
              ? "The finding this citation points to."
              : "This citation isn't part of what's currently in view."}
          </SheetDescription>
        </SheetHeader>
        {claim !== undefined ? (
          <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
            <div className="rounded-lg border border-border bg-bg-inset p-4">
              <p className="text-sm leading-6 text-fg">{stripEmDashes(claim.text)}</p>
            </div>

            {!isStoredClaim ? (
              <p className="text-xs text-fg-tertiary">
                This source was read live and was never stored as a finding, so it can&rsquo;t be added to a board yet.
              </p>
            ) : null}

            {claim.value !== undefined ? (
              <div className="flex items-center gap-2">
                <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>Value</span>
                <span className="font-mono tabular-nums text-sm text-fg">
                  {claim.value}
                  {claim.unit !== undefined ? ` ${measureName(claim.unit)}` : ""}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>Source</span>
              <PlatformLogo engine={claim.sourceEngine} className="size-4" />
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
                  "inline-flex w-fit items-center gap-1.5 rounded-sm border border-border-strong bg-bg-raised px-3 py-1.5 text-sm text-fg-secondary shadow-[var(--shadow-xs)]",
                  "transition-colors duration-150 ease-out hover:border-fg-tertiary hover:bg-bg-inset hover:text-fg",
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
