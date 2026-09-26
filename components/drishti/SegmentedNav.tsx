"use client";


import type { KeyboardEvent, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";
import { PRESS_CLASS, STATE_TRANSITION_CLASS, iconProps } from "./tokens";

export type SegmentedNavItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SegmentedNavProps = {
  items: SegmentedNavItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  className?: string;
};

export type SegmentedTabState = {
  active: boolean;
  selectable: boolean;
  tabIndex: number;
};

export const SEGMENTED_ACTIVE_CLASS =
  "bg-[var(--accent)] text-[var(--accent-ink)]";

export const SEGMENTED_INACTIVE_CLASS =
  "cursor-pointer bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]";

export const SEGMENTED_UNAVAILABLE_CLASS =
  "cursor-not-allowed bg-transparent text-[var(--text-tertiary)]";

export function segmentedTabState(input: {
  id: string;
  value: string;
  itemDisabled?: boolean;
  navDisabled?: boolean;
  loading?: boolean;
}): SegmentedTabState {
  const active = input.id === input.value;
  const selectable =
    !input.itemDisabled && !input.navDisabled && !input.loading;
  return {
    active,
    selectable,
    tabIndex: selectable && active ? 0 : -1,
  };
}

export function SegmentedNav({
  items,
  value,
  onChange,
  label,
  disabled = false,
  loading = false,
  error = null,
  className,
}: SegmentedNavProps) {
  const selectableIds = items
    .filter(
      (item) =>
        segmentedTabState({
          id: item.id,
          value,
          itemDisabled: item.disabled,
          navDisabled: disabled,
          loading,
        }).selectable,
    )
    .map((item) => item.id);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key) || selectableIds.length === 0) return;
    event.preventDefault();
    const currentIndex = selectableIds.indexOf(value);
    let nextIndex = currentIndex < 0 ? 0 : currentIndex;
    if (event.key === "ArrowRight") {
      nextIndex = (nextIndex + 1) % selectableIds.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (nextIndex - 1 + selectableIds.length) % selectableIds.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = selectableIds.length - 1;
    }
    const nextId = selectableIds[nextIndex];
    onChange(nextId);
    const target = event.currentTarget.querySelector<HTMLButtonElement>(
      `[data-tab-id="${nextId}"]`,
    );
    target?.focus();
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <div
        role="tablist"
        aria-label={label}
        aria-busy={loading || undefined}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        className="inline-flex max-w-full items-center gap-1 rounded-md bg-[var(--bg-inset)] p-[3px]"
      >
        {loading
          ? Array.from({ length: Math.max(3, items.length) }, (_, index) => (
              <Skeleton
                key={index}
                variant="pill"
                width={index % 2 === 0 ? 84 : 68}
                className="h-7"
              />
            ))
          : items.map((item) => {
              const state = segmentedTabState({
                id: item.id,
                value,
                itemDisabled: item.disabled,
                navDisabled: disabled,
                loading,
              });
              const unavailable = disabled || item.disabled;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  data-tab-id={item.id}
                  aria-selected={state.active}
                  tabIndex={state.tabIndex}
                  disabled={unavailable}
                  data-state={state.active ? "active" : "default"}
                  onClick={() => onChange(item.id)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-sm px-3 text-[12.5px] font-medium whitespace-nowrap",
                    "max-[899px]:min-h-11",
                    state.active
                      ? SEGMENTED_ACTIVE_CLASS
                      : unavailable
                        ? SEGMENTED_UNAVAILABLE_CLASS
                        : cn(SEGMENTED_INACTIVE_CLASS, PRESS_CLASS, STATE_TRANSITION_CLASS),
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent-dim)]",
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
      </div>
      {error ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-[12.5px] leading-[1.5] text-[var(--danger)]"
        >
          <CircleAlert {...iconProps} size={14} aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
