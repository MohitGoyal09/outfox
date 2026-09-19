"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";

export type EvidenceClaim = {
  value?: string | number;
  metric?: string;
  sourceQuery: string;
  evidenceUrl: string;
  fetchedAt: string;
  text: string;
};

export function EvidencePanel({
  claim,
  loading = false,
  className,
}: {
  claim: EvidenceClaim | null | undefined;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        <Spinner className="size-4" />
        Loading evidence.
      </div>
    );
  }
  if (!claim) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No evidence selected. Pick a citation chip in the brief to see its
        source.
      </div>
    );
  }
  const href = claim.evidenceUrl;
  const hrefAllowed = /^https?:\/\//i.test(href);
  return (
    <article
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-card-foreground">Evidence</h3>
      <p className="mt-2 text-sm text-foreground">{claim.text}</p>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted-foreground">Value</dt>
          <dd className="text-foreground">
            {claim.value !== undefined && claim.value !== ""
              ? String(claim.value)
              : "Not stated"}
            {claim.metric ? ` (${claim.metric})` : ""}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted-foreground">Query</dt>
          <dd className="text-foreground">{claim.sourceQuery}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted-foreground">Fetched</dt>
          <dd className="text-foreground">{claim.fetchedAt}</dd>
        </div>
      </dl>
      {hrefAllowed ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open source <ExternalLinkIcon className="size-3.5" />
        </a>
      ) : (
        <p className="mt-3 break-all text-sm text-muted-foreground">{href}</p>
      )}
    </article>
  );
}
