"use client";


import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { CohortComposer } from "@/components/drishti/cohorts/CohortComposer";
import { CohortList } from "@/components/drishti/cohorts/CohortList";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import { useAllRuns } from "@/components/drishti/cohorts/useAllRuns";
import {
  groupRunsByCohort,
  type BrandDoc,
  type CohortSummary,
} from "@/components/drishti/cohorts/cohorts-model";
import { useCreateBrand } from "@/components/drishti/brands/useCreateBrand";
import { VALUE_CLASS } from "@/components/drishti/tokens";
import { cn } from "@/lib/utils";

export default function CohortsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="type-display text-[var(--text-primary,#eeeef2)]">Cohorts</h1>
        <p className="max-w-[68ch] text-[14px] leading-[1.5] text-[var(--text-secondary,#9797a3)]">
          A cohort is the set of rivals one run compares. Every run belongs to
          one cohort, and every claim belongs to one run.
        </p>
      </header>

      <QueryBoundary label="The cohorts surface">
        <CohortsBody />
      </QueryBoundary>
    </div>
  );
}

function CohortsBody() {
  const router = useRouter();
  const { runs, isLoading: isLoadingRuns } = useAllRuns();
  const brands = useQuery(api.brands.listBrands);
  const { submit, isSaving, error, success, reset } = useCreateBrand();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const brandList: BrandDoc[] = useMemo(() => brands ?? [], [brands]);
  const isLoadingBrands = brands === undefined;
  const isLoading = isLoadingRuns || isLoadingBrands;

  const cohorts = useMemo(() => groupRunsByCohort(runs), [runs]);

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const brand of brandList) map[String(brand._id)] = brand.name;
    return map;
  }, [brandList]);

  const summary = isLoading
    ? null
    : `${cohorts.length} ${cohorts.length === 1 ? "cohort" : "cohorts"} · ${brandList.length} ${
        brandList.length === 1 ? "rival" : "rivals"
      } tracked`;

  function onEdit(cohort: CohortSummary) {
    setSelectedIds(cohort.brandIds);
    setEditingKey(cohort.cohortKey);
    reset();
  }

  function onReset() {
    setSelectedIds([]);
    setEditingKey(null);
    reset();
  }

  function onOpenCohort() {
    if (selectedIds.length === 0) return;
    const key = [...selectedIds].sort().join(":");
    router.push(`/compare/${encodeURIComponent(key)}`);
  }

  return (
    <div className="grid gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_400px] min-[900px]:items-start">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-[1.05rem] font-medium leading-[1.32] text-[var(--text-primary,#eeeef2)]">
            Your cohorts
          </h2>
          {summary !== null ? (
            <span className={cn(VALUE_CLASS, "text-[11.5px] text-[var(--text-tertiary,#64646f)]")}>
              {summary}
            </span>
          ) : null}
        </div>

        <CohortList
          cohorts={cohorts}
          nameById={nameById}
          isLoading={isLoading}
          onEdit={onEdit}
          emptyAction={
            <Link
              href="#cohort-composer"
              className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-[var(--border-strong,#35353f)] px-3 text-[13px] text-[var(--text-primary,#eeeef2)] hover:bg-[var(--bg-raised,#131319)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)]"
            >
              <Users aria-hidden="true" strokeWidth={1.5} className="size-4" />
              Build a cohort
            </Link>
          }
        />
      </section>

      <aside
        id="cohort-composer"
        className="min-w-0 min-[900px]:sticky min-[900px]:top-36"
      >
        <CohortComposer
          brands={brandList}
          isLoadingBrands={isLoadingBrands}
          selectedIds={selectedIds}
          onChangeSelected={setSelectedIds}
          editingKey={editingKey}
          onCreateBrand={submit}
          isSavingBrand={isSaving}
          createError={error}
          createSuccess={success}
          onOpenCohort={onOpenCohort}
          onReset={onReset}
        />
      </aside>
    </div>
  );
}
