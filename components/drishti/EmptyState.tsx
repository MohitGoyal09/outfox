
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isTeachingCopy } from "./tokens";

export type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  size?: "sm" | "md";
  bounded?: boolean;
  className?: string;
};

export type ComposedEmptyState = {
  title: string;
  description: string;
  hasAction: boolean;
  size: "sm" | "md";
  bounded: boolean;
  teaching: boolean;
};

export function composedEmptyState(input: {
  title: string;
  description: string;
  action?: ReactNode;
  size?: "sm" | "md";
  bounded?: boolean;
}): ComposedEmptyState {
  const title = input.title.trim();
  const description = input.description.trim();
  return {
    title,
    description,
    hasAction: input.action !== undefined && input.action !== null,
    size: input.size ?? "md",
    bounded: input.bounded ?? false,
    teaching: isTeachingCopy(title) && isTeachingCopy(description),
  };
}

export function EmptyState({
  title,
  description,
  action,
  size = "md",
  bounded = false,
  className,
}: EmptyStateProps) {
  const composed = composedEmptyState({ title, description, action, size, bounded });
  if (
    process.env.NODE_ENV !== "production" &&
    !composed.teaching &&
    typeof console !== "undefined"
  ) {
    console.error(
      `EmptyState copy carries no information: title="${composed.title}", description="${composed.description}". Name what would appear here.`,
    );
  }
  return (
    <section
      className={cn(
        "flex flex-col items-center text-center",
        composed.size === "md" ? "gap-3 py-8" : "gap-2 py-4",
        composed.bounded &&
          "rounded-lg border border-dashed border-border-strong bg-bg-inset px-5 py-12",
        className,
      )}
    >
      <h3
        className="type-headline text-balance text-fg"
      >
        {composed.title}
      </h3>
      <p className="max-w-[46ch] text-balance text-sm text-fg-secondary">
        {composed.description}
      </p>
      {composed.hasAction ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{action}</div>
      ) : null}
    </section>
  );
}
