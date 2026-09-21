"use client";


import type { ReactNode } from "react";
import { Check, CircleAlert, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { EmptyState } from "../EmptyState";
import { SkeletonRows } from "../Skeleton";
import {
  PRESS_CLASS,
  STATE_TRANSITION_CLASS,
  VALUE_CLASS,
  iconProps,
} from "../tokens";
import {
  capReason,
  cohortBoundText,
  profileStatusLabel,
  profileStatusTone,
  type BrandDoc,
} from "./cohorts-model";

export type CohortPickerProps = {
  brands: BrandDoc[];
  selectedIds: string[];
  maxBrands: number;
  onChange: (selectedIds: string[]) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyAction?: ReactNode;
  className?: string;
};

export type PickerRowState = {
  selected: boolean;
  atCap: boolean;
  selectable: boolean;
};

export function pickerRowState(input: {
  id: string;
  selectedIds: string[];
  maxBrands: number;
  isLoading?: boolean;
}): PickerRowState {
  const selected = input.selectedIds.includes(input.id);
  const atCap = input.selectedIds.length >= input.maxBrands;
  return {
    selected,
    atCap,
    selectable: !input.isLoading && (selected || !atCap),
  };
}

export function CohortPicker({
  brands,
  selectedIds,
  maxBrands,
  onChange,
  isLoading = false,
  error = null,
  onRetry,
  emptyAction,
  className,
}: CohortPickerProps) {
  const bound = cohortBoundText(selectedIds.length, maxBrands);
  const atCap = selectedIds.length >= maxBrands;

  function toggle(id: string) {
    const state = pickerRowState({ id, selectedIds, maxBrands, isLoading });
    if (!state.selectable) return;
    if (state.selected) {
      onChange(selectedIds.filter((selected) => selected !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[13px] font-medium text-[var(--text-primary,#eeeef2)]">
          Rivals in this cohort
        </h3>
        <span
          className={cn(
            VALUE_CLASS,
            "text-[11.5px]",
            atCap
              ? "text-[var(--warn,#fbbf24)]"
              : "text-[var(--text-tertiary,#64646f)]",
          )}
        >
          {bound}
        </span>
      </div>

      {error !== null ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-[5px] border border-[var(--danger,#f87171)] px-3 py-2 text-[12.5px] leading-[1.5] text-[var(--danger,#f87171)]"
        >
          <CircleAlert {...iconProps} size={14} aria-hidden="true" className="size-3.5 shrink-0" />
          <span>{error}</span>
          {onRetry ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              icon={<RefreshCw {...iconProps} size={14} />}
            >
              Retry
            </Button>
          ) : null}
        </div>
      ) : isLoading ? (
        <SkeletonRows count={4} variant="row" className="mt-1" />
      ) : brands.length === 0 ? (
        <EmptyState
          size="sm"
          bounded
          icon={<Users {...iconProps} size={16} />}
          title="A cohort needs at least one rival."
          description="A cohort is a set of rivals compared in one run. Add a rival, then select it here to open the comparison."
          action={emptyAction}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {brands.map((brand) => {
              const id = String(brand._id);
              const state = pickerRowState({ id, selectedIds, maxBrands, isLoading });
              return (
                <li key={id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={state.selected}
                    disabled={!state.selectable}
                    onClick={() => toggle(id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left",
                      "max-[899px]:min-h-11",
                      STATE_TRANSITION_CLASS,
                      state.selected
                        ? "border-[var(--accent,#e2a339)] bg-[var(--bg-raised-2,#191922)]"
                        : state.selectable
                          ? cn(
                              "border-[var(--border,#24242f)] bg-[var(--bg-raised,#131319)] hover:border-[var(--border-strong,#35353f)] hover:bg-[var(--bg-raised-2,#191922)]",
                              PRESS_CLASS,
                            )
                          : "cursor-not-allowed border-[var(--border,#24242f)] bg-[var(--bg-raised,#131319)] opacity-60",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)] focus-visible:ring-[3px] focus-visible:ring-[rgba(226,163,57,0.22)]",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[3px] border",
                        state.selected
                          ? "border-[var(--accent,#e2a339)] bg-[var(--accent,#e2a339)] text-[var(--accent-ink,#1a1204)]"
                          : "border-[var(--border-strong,#35353f)]",
                      )}
                    >
                      {state.selected ? (
                        <Check {...iconProps} size={14} className="size-3.5" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-[var(--text-primary,#eeeef2)]">
                        {brand.name}
                      </span>
                      <span
                        className={cn(
                          VALUE_CLASS,
                          "mt-0.5 block truncate text-[11.5px] text-[var(--text-tertiary,#64646f)]",
                        )}
                      >
                        {brand.domain} · {brand.vertical}
                      </span>
                    </span>
                    <Chip
                      label={profileStatusLabel(brand.profileStatus)}
                      tone={profileStatusTone(brand.profileStatus)}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          {atCap ? (
            <p className={cn("text-[12px] leading-[1.45] text-[var(--warn,#fbbf24)]")}>
              {capReason(maxBrands)}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
