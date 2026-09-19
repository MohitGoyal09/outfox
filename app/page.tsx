"use client";

import { BrandForm } from "@/components/BrandForm";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function Home() {
  const brands = useQuery(api.brands.listBrands);
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  const cohortKey = useMemo(
    () => [...selected].sort().join(":"),
    [selected],
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function open(mode: "cached" | "live") {
    if (cohortKey === "") return;
    router.push(`/compare/${encodeURIComponent(cohortKey)}?mode=${mode}`);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Drishti
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              Commerce intelligence with evidence.
            </h1>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">
              Pick a brand cohort, load what is cached, or run one live
              refresh with approval.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-base font-semibold text-card-foreground">
              Cohort picker
            </h2>
            {brands === undefined ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" /> Loading brands.
              </p>
            ) : brands.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No brands yet. Create the first one on the right, then pick
                it here.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {brands.map((brand) => (
                  <li key={String(brand._id)}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.includes(String(brand._id))}
                        onChange={() => toggle(String(brand._id))}
                        aria-label={`Select ${brand.name}`}
                      />
                      <span className="font-medium text-foreground">
                        {brand.name}
                      </span>
                      <span className="text-muted-foreground">
                        {brand.domain} · {brand.vertical} · {brand.profileStatus}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={cohortKey === ""}
                onClick={() => open("cached")}
              >
                Load cached
              </Button>
              <Button
                variant="outline"
                disabled={cohortKey === ""}
                onClick={() => open("live")}
              >
                Run live refresh
              </Button>
            </div>
            {cohortKey !== "" ? (
              <p className="mt-3 break-all text-xs text-muted-foreground">
                Cohort key: {cohortKey}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Select at least one brand to continue.
              </p>
            )}
          </div>
        </section>
        <BrandForm />
      </div>
    </main>
  );
}
