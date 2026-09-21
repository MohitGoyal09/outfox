"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className={cn("flex items-center gap-2 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground", className)}>
        <Spinner className="size-4" />
        Loading evidence.
      </div>
    );
  }
  if (!claim) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border bg-card p-5 text-sm text-muted-foreground", className)}>
        No evidence selected. Pick a citation chip in the brief to see its
        source.
      </div>
    );
  }
  const href = claim.evidenceUrl;
  const hrefAllowed = /^https?:\/\//i.test(href);
  return (
    <Card className={cn("border-border/80 bg-card shadow-none", className)}>
      <CardHeader className="border-b border-border/70 px-5 py-4"><CardTitle className="text-sm font-semibold tracking-[-0.01em]">Evidence</CardTitle></CardHeader>
      <CardContent className="p-5">
      <p className="mt-2 text-sm text-[var(--text-primary)]">{claim.text}</p>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-[var(--text-tertiary)]">Value</dt>
          <dd className="text-[var(--text-primary)]">
            {claim.value !== undefined && claim.value !== ""
              ? String(claim.value)
              : "Not stated"}
            {claim.metric ? ` (${claim.metric})` : ""}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-[var(--text-tertiary)]">Query</dt>
          <dd className="text-[var(--text-primary)]">{claim.sourceQuery}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-[var(--text-tertiary)]">Fetched</dt>
          <dd className="text-[var(--text-primary)]">{claim.fetchedAt}</dd>
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
      </CardContent>
    </Card>
  );
}
