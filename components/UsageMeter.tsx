"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function UsageMeter({
  requestCount,
  creditCount,
  loading = false,
  error = null,
  className,
}: {
  requestCount?: number;
  creditCount?: number;
  loading?: boolean;
  error?: string | null;
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
        <Spinner className="size-4" /> Loading usage.
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
        Usage failed to load: {error}
      </div>
    );
  }
  if (requestCount === undefined) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        No run yet, so no usage to show. Load a cached run or refresh to see
        SerpApi counts.
      </div>
    );
  }
  return (
    <section
      aria-label="Usage"
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-card-foreground">
        Run usage
      </h3>
      <dl className="mt-2 flex flex-wrap gap-6 text-sm">
        <div>
          <dt className="text-muted-foreground">SerpApi requests</dt>
          <dd className="text-xl font-semibold text-foreground">
            {requestCount}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Credits this run</dt>
          <dd className="text-xl font-semibold text-foreground">
            {creditCount ?? "Not reported"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
