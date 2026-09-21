import { cn } from "@/lib/utils";

export type StatReadoutProps = {
  searchesUsed?: number | null;
  searchesLimit?: number | null;
  costUsd?: number | null;
  costProvenance?: "provider" | "estimated" | "unknown" | null;
  isLoading?: boolean;
  className?: string;
};

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatUsd(value: number): string {
  const fixed = value.toFixed(3);
  return `$${fixed.endsWith("0") ? value.toFixed(2) : fixed}`;
}

export function StatReadout({
  searchesUsed,
  searchesLimit,
  costUsd,
  costProvenance,
  isLoading = false,
  className,
}: StatReadoutProps) {
  const used = finite(searchesUsed);
  const limit = finite(searchesLimit);
  const cost = finite(costUsd);

  if (isLoading) {
    return (
      <span
        aria-hidden
        className={cn(
          "num inline-block h-3.5 w-28 animate-pulse rounded-sm bg-bg-raised-2",
          className,
        )}
      />
    );
  }

  const searches = used !== null && limit !== null ? `${used}/${limit}` : "—";
  const costText =
    cost !== null
      ? `${formatUsd(cost)}${costProvenance === "estimated" ? " est." : ""}`
      : "—";

  return (
    <p
      className={cn(
        "num text-xs text-fg-secondary",
        className,
      )}
      aria-label="Searches used and last run cost"
    >
      {searches}
      <span aria-hidden className="px-1.5 text-fg-tertiary">
        ·
      </span>
      {costText}
    </p>
  );
}
