import { SearchX } from "lucide-react";

export function NotFoundInCheck({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <p className="flex items-start gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-fg-secondary">
      <SearchX aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-tertiary" />
      <span>
        <span className="font-medium text-fg">Not found in this check:</span> {items.join(", ")}.
      </span>
    </p>
  );
}
