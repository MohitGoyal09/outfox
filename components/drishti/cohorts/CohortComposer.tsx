"use client";


import { useState } from "react";
import { ArrowRight, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../Button";
import { Panel } from "../Panel";
import { LABEL_CLASS, VALUE_CLASS, iconProps } from "../tokens";
import { BrandForm, type BrandCreatePath, type BrandFormValues } from "../brands/BrandForm";
import { CohortPicker } from "./CohortPicker";
import {
  MAX_RIVALS_PER_COHORT,
  cohortBoundText,
  selectionReason,
  type BrandDoc,
} from "./cohorts-model";

export type CohortComposerProps = {
  brands: BrandDoc[];
  isLoadingBrands: boolean;
  brandsError?: string | null;
  onRetryBrands?: () => void;
  selectedIds: string[];
  onChangeSelected: (ids: string[]) => void;
  editingKey?: string | null;
  onCreateBrand: (values: BrandFormValues, path: BrandCreatePath) => Promise<boolean>;
  isSavingBrand: boolean;
  createError?: string | null;
  createSuccess?: string | null;
  onOpenCohort: () => void;
  onReset: () => void;
  className?: string;
};

export function CohortComposer({
  brands,
  isLoadingBrands,
  brandsError = null,
  onRetryBrands,
  selectedIds,
  onChangeSelected,
  editingKey = null,
  onCreateBrand,
  isSavingBrand,
  createError = null,
  createSuccess = null,
  onOpenCohort,
  onReset,
  className,
}: CohortComposerProps) {
  const [adding, setAdding] = useState(false);
  const reason = selectionReason(selectedIds.length);
  const bound = cohortBoundText(selectedIds.length, MAX_RIVALS_PER_COHORT);
  const cohortKey = [...selectedIds].sort().join(":");

  return (
    <Panel
      as="section"
      interactive={false}
      padded
      ariaLabel={editingKey === null ? "Build a cohort" : "Edit cohort"}
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-[5px] border border-[var(--border,#24242f)] bg-[var(--bg-inset,#0e0e13)] text-[var(--text-tertiary,#64646f)]"
          >
            <Users {...iconProps} size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[1.2rem] font-semibold leading-[1.28] tracking-[-0.01em] text-[var(--text-primary,#eeeef2)]">
              {editingKey === null ? "Build a cohort" : "Edit rivals"}
            </h2>
            <p className="mt-1 max-w-[68ch] text-[13px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
              A cohort is the set of rivals one run compares. Pick up to{" "}
              {MAX_RIVALS_PER_COHORT}.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding((value) => !value)}
          aria-expanded={adding}
          icon={<Plus {...iconProps} size={14} />}
        >
          {adding ? "Hide add rival" : "Add a rival"}
        </Button>
      </div>

      {adding ? (
        <BrandForm
          existingBrands={brands}
          onSubmit={onCreateBrand}
          isSaving={isSavingBrand}
          error={createError}
          success={createSuccess}
          framed={false}
        />
      ) : null}

      <CohortPicker
        brands={brands}
        selectedIds={selectedIds}
        maxBrands={MAX_RIVALS_PER_COHORT}
        onChange={onChangeSelected}
        isLoading={isLoadingBrands}
        error={brandsError}
        {...(onRetryBrands ? { onRetry: onRetryBrands } : {})}
        emptyAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            icon={<Plus {...iconProps} size={14} />}
          >
            Add the first rival
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border,#24242f)] pt-4">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary,#64646f)]")}>
            selected
          </span>
          <span className={cn(VALUE_CLASS, "text-[12.5px] text-[var(--text-primary,#eeeef2)]")}>
            {bound}
          </span>
          {selectedIds.length > 1 ? (
            <span
              className={cn(VALUE_CLASS, "max-w-[24ch] truncate text-[11px] text-[var(--text-tertiary,#64646f)]")}
              title={cohortKey}
            >
              key {cohortKey.slice(0, 18)}…
            </span>
          ) : null}
        </span>

        <span className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear
          </Button>
          <Button
            onClick={onOpenCohort}
            disabled={reason !== null}
            title={reason ?? undefined}
            iconRight={<ArrowRight {...iconProps} size={16} />}
          >
            {editingKey === null ? "Open cohort" : "Open edited cohort"}
          </Button>
        </span>
      </div>

      {reason !== null ? (
        <p className="text-[12.5px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
          {reason}
        </p>
      ) : null}
    </Panel>
  );
}
