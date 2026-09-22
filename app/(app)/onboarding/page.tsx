"use client";


import { useMemo, useState } from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { useReducedMotion } from "motion/react";
import { ArrowRight, Compass } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { QueryBoundary } from "@/components/drishti/cohorts/QueryBoundary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogRow } from "@/components/drishti/onboarding/CatalogRow";
import {
  MAX_ONBOARDING_FOLLOWS,
  atFollowCap,
  findFollowedBrand,
  groupByVertical,
  hydrationStatusFor,
} from "@/components/drishti/onboarding/onboarding-model";

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-border pb-7">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-accent">
          <Compass className="size-3.5" />
          Discover
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Follow your competitors
          </h1>
          <p className="mt-2 max-w-[62ch] text-sm leading-6 text-muted-foreground">
            Pick up to {MAX_ONBOARDING_FOLLOWS} Indian D2C brands to track. Following creates your
            own copy right away; the full evidence run happens later, lazily, never all at once.
          </p>
        </div>
      </header>
      <QueryBoundary label="The brand catalog">
        <OnboardingBody />
      </QueryBoundary>
    </div>
  );
}

function OnboardingBody() {
  const catalog = useQuery(api.brandCatalog.search, { query: "" });
  const brands = useQuery(api.brands.listBrands);
  const follow = useAction(api.brandCatalog.follow);
  const reduceMotion = Boolean(useReducedMotion());

  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [followError, setFollowError] = useState<string | null>(null);

  const isLoading = catalog === undefined || brands === undefined;
  const groups = useMemo(() => groupByVertical(catalog ?? []), [catalog]);
  const followedCount = useMemo(
    () =>
      (catalog ?? []).filter((entry) => findFollowedBrand(entry, brands ?? []) !== undefined)
        .length,
    [catalog, brands],
  );
  const atCap = atFollowCap(followedCount);

  const handleFollow = async (catalogId: Id<"brandCatalog">) => {
    const id = String(catalogId);
    if (pendingIds.has(id)) return;
    setFollowError(null);
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await follow({ catalogId });
    } catch (caught) {
      setFollowError(
        caught instanceof Error && caught.message !== ""
          ? caught.message
          : "This brand could not be followed.",
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (catalog.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No catalog brands yet — the brand catalog has not been seeded. Track a brand manually from
        the <Link href="/brands" className="underline underline-offset-4">Brands page</Link> in
        the meantime.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-sm text-foreground">
          <span className="font-mono font-semibold">{followedCount}</span> of{" "}
          {MAX_ONBOARDING_FOLLOWS} followed
        </p>
        {followedCount > 0 ? (
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/brands">
              Go to your brands
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        ) : null}
      </div>
      {followError !== null ? <p className="text-sm text-destructive">{followError}</p> : null}
      {atCap ? (
        <p className="text-xs text-muted-foreground">
          You’ve followed {MAX_ONBOARDING_FOLLOWS} brands, the most onboarding tracks at once.
          Manage the list from the Brands page.
        </p>
      ) : null}
      {groups.map((group) => (
        <section key={group.vertical} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-foreground">
            {group.vertical}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.entries.map((entry) => {
              const followedBrand = findFollowedBrand(entry, brands);
              const followed = followedBrand !== undefined;
              return (
                <CatalogRow
                  key={String(entry._id)}
                  entry={entry}
                  followed={followed}
                  pending={pendingIds.has(String(entry._id))}
                  similar={group.entries.filter((sibling) => sibling._id !== entry._id).slice(0, 3)}
                  reduceMotion={reduceMotion}
                  hydrationStatus={hydrationStatusFor(followedBrand)}
                  atCap={atCap && !followed}
                  onFollow={() => void handleFollow(entry._id)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
