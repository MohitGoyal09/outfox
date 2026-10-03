"use client";


import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ArrowRight, CircleAlert, Loader2, Plus, Search, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button, Chip, EmptyState, FOCUS_RING_CLASS, Panel, iconProps } from "@/components/drishti";
import { Field } from "./Field";
import {
  MAX_ONBOARDING_COMPETITORS,
  atCompetitorCap,
  suggestCompetitors,
  validateBrandDraft,
  type BrandDraft,
  type CatalogEntry,
  unconfirmedCompetitorsNote,
  firstCheckCost,
  ADD_COMPETITOR_COST_NOTE,
} from "./onboarding-model";

export type SelectedCompetitor = {
  id: string;
  name: string;
  domain: string;
  unconfirmed?: boolean;
  createdHere?: boolean;
};

export function Step2Competitors({
  ownBrandName,
  ownDomain,
  vertical,
  selected,
  onAdd,
  onRemove,
  onContinue,
  onBack,
}: {
  ownBrandName: string;
  ownDomain: string;
  vertical: string;
  selected: SelectedCompetitor[];
  onAdd: (competitor: SelectedCompetitor) => void;
  onRemove: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const catalog = useQuery(api.brandCatalog.byVertical, { vertical });
  const follow = useAction(api.brandCatalog.follow);
  const createBrandProfile = useAction(api.pipeline.brandProfile.createBrandProfile);

  const [query, setQuery] = useState("");
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [followError, setFollowError] = useState<string | null>(null);
  const removeUncheckedBrand = useMutation(api.brands.removeUncheckedBrand);
  const getAccountCredits = useAction(api.credits.getAccountCredits);
  const [removingIds, setRemovingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [searchesLeft, setSearchesLeft] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    getAccountCredits({})
      .then((result) => {
        if (!cancelled) setSearchesLeft(result.ok ? result.data.totalSearchesLeft : null);
      })
      .catch(() => {
        if (!cancelled) setSearchesLeft(null);
      });
    return () => {
      cancelled = true;
    };
  }, [getAccountCredits]);

  async function handleRemove(row: SelectedCompetitor) {
    if (row.createdHere !== true) {
      onRemove(row.id);
      return;
    }
    setRemovingIds((prev) => new Set(prev).add(row.id));
    try {
      const result = await removeUncheckedBrand({ brandId: row.id as Id<"brands"> });
      if (!result.removed) {
        setFollowError(`${row.name} stays in your tracked brands: ${result.reason ?? "it could not be removed"}.`);
      }
      onRemove(row.id);
    } catch (caught) {
      setFollowError(caught instanceof Error && caught.message !== "" ? caught.message : `${row.name} could not be removed.`);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    }
  }
  const cost = firstCheckCost(selected.length + 1, searchesLeft);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState<BrandDraft>({ name: "", domain: "" });
  const [customTouched, setCustomTouched] = useState(false);
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const atCap = atCompetitorCap(selected.length);
  const selectedDomains = useMemo(() => selected.map((row) => row.domain), [selected]);

  const suggestions = useMemo(
    () =>
      catalog === undefined
        ? []
        : suggestCompetitors({ catalog, vertical, ownDomain, query, excludeDomains: selectedDomains }),
    [catalog, vertical, ownDomain, query, selectedDomains],
  );

  const isLoading = catalog === undefined;
  const catalogEmpty = catalog !== undefined && catalog.filter((entry) => entry.vertical === vertical).length === 0;
  const noMatches = !isLoading && !catalogEmpty && query.trim() !== "" && suggestions.length === 0;

  async function handleAdd(entry: CatalogEntry) {
    if (atCap) return;
    const id = String(entry._id);
    setFollowError(null);
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      const result = await follow({ catalogId: entry._id as Id<"brandCatalog"> });
      onAdd({
        id: String(result.brandId),
        name: entry.name,
        domain: entry.domain,
        unconfirmed: result.status !== "ready",
        createdHere: result.created,
      });
    } catch (caught) {
      setFollowError(caught instanceof Error && caught.message !== "" ? caught.message : "This brand could not be added.");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleAddCustom() {
    setCustomTouched(true);
    const validation = validateBrandDraft(customDraft);
    if (validation.name !== undefined || validation.domain !== undefined) return;
    setCustomError(null);
    setCustomSubmitting(true);
    try {
      const result = await createBrandProfile({
        name: customDraft.name,
        domain: customDraft.domain,
        vertical,
      });
      onAdd({
        id: String(result.brandId),
        name: customDraft.name.trim(),
        domain: customDraft.domain.trim(),
        unconfirmed: result.status !== "ready",
        createdHere: result.created,
      });
      setCustomDraft({ name: "", domain: "" });
      setCustomTouched(false);
      setCustomOpen(false);
    } catch (caught) {
      setCustomError(caught instanceof Error && caught.message !== "" ? caught.message : "That brand could not be added.");
    } finally {
      setCustomSubmitting(false);
    }
  }

  const customErrors = customTouched ? validateBrandDraft(customDraft) : {};
  const unconfirmedNote = unconfirmedCompetitorsNote(
    selected.filter((row) => row.unconfirmed === true).map((row) => row.name),
  );

  return (
    <div className="flex flex-col gap-6">
      {selected.length > 0 ? (
        <Panel as="section" interactive={false} padded ariaLabel="Selected competitors">
          <p className="mb-2.5 text-[12px] font-medium text-[var(--text-secondary)]">
            Comparing against {selected.length} of {MAX_ONBOARDING_COMPETITORS}
          </p>
          <ul className="flex flex-wrap gap-2">
            {selected.map((row) => (
              <li key={row.id}>
                <Chip size="md" dot={false}>
                  <span className="inline-flex items-center gap-1.5">
                    {row.name}
                    {row.unconfirmed ? (
                      <span className="text-[12px] font-medium text-[var(--text-tertiary)]">
                        not confirmed
                      </span>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Remove ${row.name}`}
                      onClick={() => void handleRemove(row)}
                      disabled={removingIds.has(row.id)}
                      className="rounded-full p-0.5 text-[var(--text-tertiary)] hover:text-[var(--danger)]"
                    >
                      <X {...iconProps} size={12} aria-hidden="true" className="size-3" />
                    </button>
                  </span>
                </Chip>
              </li>
            ))}
          </ul>
          {unconfirmedNote !== null ? (
            <p className="mt-2.5 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">{unconfirmedNote}</p>
          ) : null}
        </Panel>
      ) : null}

      {atCap ? (
        <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
          You&rsquo;ve picked {MAX_ONBOARDING_COMPETITORS} competitors, the most a first check
          compares at once, alongside {ownBrandName}. Remove one to swap it for another.
        </p>
      ) : (
        <div className="relative">
          <Search
            {...iconProps}
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${vertical.toLowerCase()} brands…`}
            aria-label="Search competitors"
            className={`h-10 w-full rounded-sm border border-[var(--border-strong)] bg-[var(--bg-inset)] pl-9 pr-3 text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--border-strong)] ${FOCUS_RING_CLASS}`}
          />
        </div>
      )}

      {followError !== null ? (
        <p role="alert" className="flex items-start gap-1.5 text-[13px] leading-[1.5] text-[var(--danger)]">
          <CircleAlert {...iconProps} size={14} aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {followError}
        </p>
      ) : null}

      {!atCap ? (
        isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="h-14 animate-pulse rounded-lg bg-[var(--bg-inset)]" />
            ))}
          </div>
        ) : catalogEmpty ? (
          <EmptyState
            size="sm"
            title={`No catalog brands in ${vertical} yet`}
            description="Add competitors by name and website instead, Drishti still runs the same check against them."
          />
        ) : noMatches ? (
          <EmptyState
            size="sm"
            title={`No matches for "${query.trim()}"`}
            description="Try a different spelling, or add the brand by name and website instead."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((entry) => {
              const id = String(entry._id);
              const pending = pendingIds.has(id);
              return (
                <li key={id}>
                  <Panel interactive={false} padded className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-[var(--text-primary)]">{entry.name}</p>
                      <p className="truncate text-[12px] text-[var(--text-secondary)]">{entry.domain}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => void handleAdd(entry)}
                      icon={pending ? <Loader2 {...iconProps} size={14} className="animate-spin" /> : <Plus {...iconProps} size={14} />}
                      aria-label={`Add ${entry.name}`}
                    >
                      Add
                    </Button>
                  </Panel>
                </li>
              );
            })}
          </ul>
        )
      ) : null}

      {!atCap ? (
        customOpen ? (
          <Panel as="section" interactive={false} padded ariaLabel="Add a competitor by name and website">
            <div className="flex flex-col gap-3">
              <Field
                id="custom-competitor-name"
                label="Brand name"
                value={customDraft.name}
                onChange={(event) => setCustomDraft({ ...customDraft, name: event.target.value })}
                error={customErrors.name}
              />
              <Field
                id="custom-competitor-domain"
                label="Website"
                placeholder="e.g. example.com"
                value={customDraft.domain}
                onChange={(event) => setCustomDraft({ ...customDraft, domain: event.target.value })}
                error={customErrors.domain}
              />
              {customError !== null ? (
                <p role="alert" className="text-[13px] leading-[1.5] text-[var(--danger)]">
                  {customError}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button type="button" size="sm" loading={customSubmitting} onClick={() => void handleAddCustom()}>
                  Add competitor
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setCustomOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Panel>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setCustomOpen(true)} icon={<Plus {...iconProps} size={14} />} className="self-start">
            Add a brand not listed here
          </Button>
        )
      ) : null}

      <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-5 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
        <p>{ADD_COMPETITOR_COST_NOTE}</p>
        <p>{cost.summary}</p>
        {cost.warning !== null ? (
          <p className="flex items-start gap-1.5 text-[var(--text-primary)]">
            <CircleAlert {...iconProps} size={14} aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            {cost.warning}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          disabled={cost.blocked}
          iconRight={<ArrowRight {...iconProps} size={14} />}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
