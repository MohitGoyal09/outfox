"use client";

import { EvidencePanel, type EvidenceClaim } from "@/components/EvidencePanel";
import { MessageResponse } from "@/components/ai-elements/message";
import { Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { LABEL_CLASS } from "@/components/drishti";
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
          "flex items-center gap-2 border-t border-[var(--border)] py-5 text-sm text-[var(--text-secondary)]",
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
          "border-t border-[var(--danger)] py-5 text-sm text-[var(--danger)]",
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
          "border-t border-[var(--border)] py-5 text-sm text-[var(--text-secondary)]",
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
        "border-t border-[var(--border)] py-5",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-title text-[var(--text-primary)]">Brief</h2>
        <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>cited response</span>
      </div>
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
