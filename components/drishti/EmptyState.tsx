
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DISPLAY_FONT_STACK, isTeachingCopy } from "./tokens";

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
  icon,
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
        "flex flex-col items-start",
        composed.size === "md" ? "gap-3 py-6" : "gap-2 py-3",
        composed.bounded &&
          "rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-inset)] px-5 py-6",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--bg-inset)] text-[var(--text-tertiary)]"
        >
          {icon}
        </span>
      ) : null}
      <h3
        style={{ fontFamily: DISPLAY_FONT_STACK }}
        className={cn(
          "text-balance font-semibold tracking-[-0.01em] text-[var(--text-primary)]",
          composed.size === "md"
            ? "text-[1.05rem] leading-[1.32]"
            : "text-[0.95rem] leading-[1.35]",
        )}
      >
        {composed.title}
      </h3>
      <p className="max-w-[56ch] text-[13px] leading-[1.5] text-[var(--text-secondary)]">
        {composed.description}
      </p>
      {composed.hasAction ? (
        <div className="mt-1 flex flex-wrap items-center gap-2">{action}</div>
      ) : null}
    </section>
  );
}
