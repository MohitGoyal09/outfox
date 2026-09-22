"use client";


import { useMemo, useState } from "react";
import { GitCompare } from "lucide-react";
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
  type RunDoc,
} from "@/components/drishti/cohorts/cohorts-model";
import { brandNameMap } from "@/components/drishti/runs";
import { useCreateBrand } from "@/components/drishti/brands/useCreateBrand";
import { Button } from "@/components/ui/button";

export default function ComparisonsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Comparative research</p>
        <h1 className="font-heading text-3xl font-medium tracking-[-0.035em] text-foreground sm:text-4xl">Comparisons</h1>
        <p className="max-w-[68ch] text-sm leading-6 text-muted-foreground">
          A comparison set is the rivals one cohort tracks, and its run history is
          every timestamped snapshot Drishti has taken of that set. Build a set,
          then open any run to see the evidence behind it.
        </p>
      </header>

      <QueryBoundary label="The comparisons surface">
        <ComparisonsBody />
      </QueryBoundary>
    </div>
  );
}

function ComparisonsBody() {
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

  const runNames = useMemo(() => brandNameMap(brandList), [brandList]);

  const runsByCohortKey = useMemo(() => {
    const map = new Map<string, RunDoc[]>();
    for (const run of runs) {
      const group = map.get(run.cohortKey);
      if (group === undefined) map.set(run.cohortKey, [run]);
      else group.push(run);
    }
    return map;
  }, [runs]);

  const summary = isLoading
    ? null
    : `${cohorts.length} ${cohorts.length === 1 ? "comparison" : "comparisons"} · ${brandList.length} ${
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
          <h2 className="type-title text-fg">
            Your comparisons
          </h2>
          <div className="flex items-center gap-3">
            {summary !== null ? (
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {summary}
              </span>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href="#cohort-composer">
                <GitCompare aria-hidden="true" className="size-4" />
                New comparison
              </Link>
            </Button>
          </div>
        </div>

        <CohortList
          cohorts={cohorts}
          nameById={nameById}
          runsByCohortKey={runsByCohortKey}
          runNames={runNames}
          isLoading={isLoading}
          onEdit={onEdit}
          emptyAction={
            <Button asChild variant="outline" size="sm">
              <Link href="#cohort-composer">
                <GitCompare aria-hidden="true" className="size-4" />
                Build a comparison
              </Link>
            </Button>
          }
        />
      </section>

      <aside
        className="min-w-0 min-[900px]:sticky min-[900px]:top-24"
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
