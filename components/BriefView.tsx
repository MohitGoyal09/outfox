"use client";

import { EvidencePanel, type EvidenceClaim } from "@/components/EvidencePanel";
import { MessageResponse } from "@/components/ai-elements/message";
import { Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type BriefClaimRef = EvidenceClaim & {
  id: string;
  brandName?: string;
};

export function BriefView({
  briefText,
  claims,
  loading = false,
  error = null,
  className,
}: {
  briefText: string | null | undefined;
  claims: BriefClaimRef[];
  loading?: boolean;
  error?: string | null;
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    claims.find((c) => c.id === selectedId) ?? null;

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        <Spinner className="size-4" /> Loading brief.
      </div>
    );
  }
  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive",
          className,
        )}
      >
        Brief failed to load: {error}
      </div>
    );
  }
  if (!briefText) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No brief for this cohort yet. Load a cached run or refresh to generate
        one.
      </div>
    );
  }
  return (
    <section
      aria-label="Brief"
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-card-foreground">Brief</h2>
      <div className="mt-2 text-sm">
        <MessageResponse>{briefText}</MessageResponse>
      </div>
      {claims.length > 0 ? (
        <Sources className="mt-4">
          <SourcesTrigger count={claims.length} />
          <SourcesContent>
            <div className="flex flex-wrap gap-2">
              {claims.map((claim) => (
                <Badge
                  key={claim.id}
                  asChild
                  variant={
                    selectedId === claim.id ? "default" : "secondary"
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedId((prev) =>
                        prev === claim.id ? null : claim.id,
                      )
                    }
                    aria-pressed={selectedId === claim.id}
                    title={claim.text}
                  >
                    {claim.brandName
                      ? `${claim.brandName}: ${claim.id.slice(0, 6)}`
                      : claim.id.slice(0, 8)}
                  </button>
                </Badge>
              ))}
            </div>
          </SourcesContent>
        </Sources>
      ) : null}
      <EvidencePanel claim={selected} className="mt-4" />
    </section>
  );
}
