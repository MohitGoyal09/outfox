"use client";


import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { ArrowRight, Check, ChevronRight, CircleAlert } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { normalizeBrandDomain } from "@/convex/lib/brandDomain";
import { cn } from "@/lib/utils";
import { Button, Chip, iconProps } from "@/components/drishti";
import { VALUE_CLASS } from "@/components/drishti/tokens";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SEARCHES_PER_BRAND_ADD } from "@/lib/constants";
import { Field } from "../onboarding/Field";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  parseRivalInput,
  profileStatusLabel,
  profileStatusTone,
  resolveRival,
  type BrandDoc,
} from "../cohorts/cohorts-model";
import {
  ADD_BRAND_STEPS,
  DEFAULT_CATEGORY,
  KNOWN_CATEGORIES,
  addBrandCostLine,
  categoryLabel,
  addBrandGate,
  canAdvance,
  closeAddBrandHref,
  domainFieldError,
  isAddBrandOpen,
  parseAliases,
  stepAnnouncement,
  type AddBrandStep,
  type BrandFormValues,
} from "./add-brand-model";
import { useCreateBrand } from "./useCreateBrand";


export function AddBrandDialog() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = isAddBrandOpen(searchParams);

  function close() {
    router.replace(closeAddBrandHref(pathname, new URLSearchParams(searchParams.toString())), { scroll: false });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px] sm:rounded-[18px] sm:max-h-[min(90dvh,720px)]",
          "max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
        )}
      >
        <Wizard />
      </DialogContent>
    </Dialog>
  );
}

function Wizard() {
  const [session, setSession] = useState(0);
  return <WizardBody key={session} onAddAnother={() => setSession((value) => value + 1)} />;
}

function WizardBody({ onAddAnother }: { onAddAnother: () => void }) {
  const brandsQuery = useQuery(api.brands.listBrands);
  const existingBrands = useMemo<BrandDoc[]>(() => brandsQuery ?? [], [brandsQuery]);
  const { submit, isSaving, error, brandId } = useCreateBrand();
  const getAccountCredits = useAction(api.credits.getAccountCredits);

  const [step, setStep] = useState<AddBrandStep>(0);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("");
  const [domainEdited, setDomainEdited] = useState(false);
  const [vertical, setVertical] = useState<string>(DEFAULT_CATEGORY);
  const [aliases, setAliases] = useState("");
  const [advertiserId, setAdvertiserId] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [forceNew, setForceNew] = useState(false);
  const [addedName, setAddedName] = useState<string | null>(null);
  const [searchesLeft, setSearchesLeft] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

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

  const done = addedName !== null;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      bodyRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [step, done]);

  const input = useMemo(() => parseRivalInput(query), [query]);
  const resolution = useMemo(() => resolveRival(input, existingBrands), [input, existingBrands]);
  const catalogHits = useQuery(
    api.brandCatalog.search,
    input.name.trim().length >= 2 ? { query: input.name.trim() } : "skip",
  );

  const confirmedCandidate =
    confirmedId === null ? null : (existingBrands.find((brand) => String(brand._id) === confirmedId) ?? null);
  const trackedBrand =
    confirmedCandidate ?? (resolution.state === "already_tracked" ? resolution.brand : null);
  const ambiguous =
    confirmedCandidate === null && !forceNew && resolution.state === "ambiguous" ? resolution.candidates : [];
  const blocked = trackedBrand !== null || ambiguous.length > 0;

  const name = input.name.trim();
  const stepInput = { name, domain, vertical, blocked };
  const nextEnabled = canAdvance(step, stepInput);
  const gate = addBrandGate(searchesLeft);
  const normalizedDomain = normalizeBrandDomain(domain);

  const catalogMatch =
    catalogHits === undefined || normalizedDomain === ""
      ? null
      : (catalogHits.find((entry) => normalizeBrandDomain(entry.domain) === normalizedDomain) ?? null);
  const catalogSuggestion = catalogMatch ?? catalogHits?.[0] ?? null;

  function onQueryChange(value: string) {
    setQuery(value);
    setConfirmedId(null);
    setForceNew(false);
    if (!domainEdited) setDomain(parseRivalInput(value).domain ?? "");
  }

  function applyExisting(brand: BrandDoc) {
    setConfirmedId(String(brand._id));
    setForceNew(false);
    setQuery(brand.name);
    setDomain(brand.domain);
    setDomainEdited(true);
    setVertical(categoryLabel(brand.vertical));
  }

  function applyCatalogEntry(entry: NonNullable<typeof catalogSuggestion>) {
    setQuery(entry.name);
    setDomain(entry.domain);
    setDomainEdited(true);
    setVertical(categoryLabel(entry.vertical));
    setAliases(entry.aliases.join(", "));
    setAdvertiserId(entry.adsTransparencyAdvertiserId ?? "");
  }

  function goNext() {
    if (!nextEnabled || step === 2) return;
    setDomain(normalizedDomain);
    setStep((step + 1) as AddBrandStep);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (step < 2) {
      goNext();
      return;
    }
    if (gate.blocked || isSaving || blocked) return;
    const values: BrandFormValues = {
      name,
      domain: normalizedDomain,
      vertical: vertical.trim(),
      aliases: parseAliases(aliases),
      ...(advertiserId.trim() !== "" ? { adsTransparencyAdvertiserId: advertiserId.trim() } : {}),
    };
    if (await submit(values, "shared")) setAddedName(name);
  }

  const domainError = touched.domain ? domainFieldError(domain) : null;
  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-col gap-3 border-b border-border px-5 pb-4 pt-5 pr-12">
        <div>
          <DialogTitle className="text-[1.05rem] font-semibold leading-[1.3] text-fg">Add a brand</DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-fg-secondary">
            Drishti builds a source-backed profile for it. Nothing is saved until the last step.
          </DialogDescription>
        </div>
        <StepHeader step={done ? 3 : step} />
      </header>
      <p aria-live="polite" className="sr-only">
        {done ? `${addedName} added` : stepAnnouncement(step)}
      </p>

      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {done ? (
          <SuccessPanel name={addedName} brandId={brandId} />
        ) : step === 0 ? (
          <FindStep
            query={query}
            onQueryChange={onQueryChange}
            input={input}
            domain={domain}
            onDomainChange={(value) => {
              setDomain(value);
              setDomainEdited(true);
            }}
            catalogLoaded={catalogHits !== undefined}
            catalogMatch={catalogMatch}
            catalogSuggestion={catalogSuggestion}
            onUseCatalog={applyCatalogEntry}
            trackedBrand={trackedBrand}
            ambiguous={ambiguous}
            onUseExisting={applyExisting}
            onCreateNew={() => {
              setForceNew(true);
              setConfirmedId(null);
            }}
            name={name}
          />
        ) : step === 1 ? (
          <div className="flex flex-col gap-4">
            <Field
              id="add-brand-domain"
              data-autofocus
              label="Website"
              value={domain}
              onChange={(event) => {
                setDomain(event.target.value);
                setDomainEdited(true);
              }}
              onBlur={() => {
                touch("domain");
                setDomain(normalizeBrandDomain(domain) || domain);
              }}
              placeholder="example.in"
              autoComplete="off"
              error={domainError}
              hint="The site this brand lives on. A pasted link is trimmed to its domain."
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-brand-vertical" className="text-[var(--text-secondary)]">
                Category
              </Label>
              <Select value={vertical} onValueChange={setVertical}>
                <SelectTrigger id="add-brand-vertical" className="h-11 w-full bg-bg-raised text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(KNOWN_CATEGORIES.includes(vertical as (typeof KNOWN_CATEGORIES)[number])
                    ? [...KNOWN_CATEGORIES]
                    : [vertical, ...KNOWN_CATEGORIES]
                  ).map((option) => (
                    <SelectItem key={option} value={option}>
                      {categoryLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field
              id="add-brand-aliases"
              label="Other names (comma separated)"
              value={aliases}
              onChange={(event) => setAliases(event.target.value)}
              placeholder="mama earth, mse"
              autoComplete="off"
              hint="Optional. Names the same brand also appears under."
            />
            <div className="rounded-sm border border-dashed border-border">
              <button
                type="button"
                aria-expanded={advancedOpen}
                aria-controls="add-brand-advanced"
                onClick={() => setAdvancedOpen((value) => !value)}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[13px] text-fg-secondary hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <ChevronRight
                  {...iconProps}
                  size={14}
                  aria-hidden="true"
                  className={cn("size-3.5 motion-safe:transition-transform", advancedOpen && "rotate-90")}
                />
                Advanced
              </button>
              {advancedOpen ? (
                <div id="add-brand-advanced" className="px-3 pb-3">
                  <Field
                    id="add-brand-advertiser"
                    label="Ad account (advertiser) ID"
                    value={advertiserId}
                    onChange={(event) => setAdvertiserId(event.target.value)}
                    placeholder="AR_123"
                          autoComplete="off"
                    hint="Optional. Left blank, we try to find one from the website; if that fails, Ads Transparency reports unavailable."
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <ReviewStep
            name={name}
            domain={normalizedDomain}
            vertical={vertical.trim()}
            aliases={parseAliases(aliases)}
            advertiserId={advertiserId.trim()}
            searchesLeft={searchesLeft}
            gateReason={gate.reason}
            error={error}
          />
        )}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-border bg-bg-inset/60 px-5 py-3">
        {done ? (
          <>
            <Button variant="ghost" onClick={onAddAnother}>
              Add another
            </Button>
            <ProfileLink brandId={brandId} />
          </>
        ) : (
          <>
            {step === 0 ? (
              <span />
            ) : (
              <Button variant="ghost" disabled={isSaving} onClick={() => setStep((step - 1) as AddBrandStep)}>
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button type="submit" disabled={!nextEnabled} iconRight={<ArrowRight {...iconProps} size={14} />}>
                Next
              </Button>
            ) : (
              <Button type="submit" loading={isSaving} disabled={gate.blocked || blocked}>
                {error !== null ? "Try again" : "Add brand"}
              </Button>
            )}
          </>
        )}
      </footer>
    </form>
  );
}

function StepHeader({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 text-[12px]" aria-label="Progress">
      {ADD_BRAND_STEPS.map((label, index) => {
        const complete = index < step;
        const current = index === step;
        return (
          <li
            key={label}
            aria-current={current ? "step" : undefined}
            className={cn("flex items-center gap-2", current ? "text-fg" : "text-fg-tertiary")}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                current && "border-accent bg-accent text-accent-ink",
                complete && "border-accent text-accent",
                !current && !complete && "border-border-strong",
              )}
            >
              {complete ? <Check {...iconProps} size={12} className="size-3" /> : index + 1}
            </span>
            <span className={cn("font-medium", !current && "hidden sm:inline")}>
              {label}
              {complete ? <span className="sr-only"> (done)</span> : null}
            </span>
            {index < ADD_BRAND_STEPS.length - 1 ? (
              <span aria-hidden="true" className="hidden h-px w-5 bg-border-strong sm:block" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

type CatalogHit = NonNullable<ReturnType<typeof useQuery<typeof api.brandCatalog.search>>>[number];

function FindStep(props: {
  query: string;
  onQueryChange: (value: string) => void;
  input: ReturnType<typeof parseRivalInput>;
  domain: string;
  onDomainChange: (value: string) => void;
  catalogLoaded: boolean;
  catalogMatch: CatalogHit | null;
  catalogSuggestion: CatalogHit | null;
  onUseCatalog: (entry: CatalogHit) => void;
  trackedBrand: BrandDoc | null;
  ambiguous: BrandDoc[];
  onUseExisting: (brand: BrandDoc) => void;
  onCreateNew: () => void;
  name: string;
}) {
  const { input, trackedBrand, ambiguous, catalogMatch, catalogSuggestion } = props;
  const needsDomainField = input.kind !== "empty" && (input.domain === null || input.inferredDomain);
  const domainShown = normalizeBrandDomain(props.domain);
  return (
    <div className="flex flex-col gap-4">
      <Field
        id="add-brand-query"
        data-autofocus
        label="Brand name, website or handle"
        value={props.query}
        onChange={(event) => props.onQueryChange(event.target.value)}
        placeholder="mamaearth.in, @minimalist, or Plum"
        autoComplete="off"
        hint="Paste a link, type a handle, or search a name."
      />

      {input.kind !== "empty" ? (
        <div className="flex flex-col gap-2 rounded-sm border border-border bg-bg-inset p-3 text-[13px]">
          <span className="text-[12px] text-fg-secondary">We found</span>
          <p className="font-medium text-fg">{props.name}</p>
          <p className={cn(VALUE_CLASS, "text-[12.5px]", domainShown === "" ? "text-fg-tertiary" : "text-fg-secondary")}>
            {domainShown === "" ? "No website yet. Add it below." : domainShown}
          </p>
          {props.catalogLoaded ? (
            <p className="text-[12.5px] text-fg-secondary">
              {catalogMatch !== null
                ? "This brand is in the Drishti catalog."
                : "Not in the Drishti catalog. You can still add it."}
            </p>
          ) : null}
          {catalogMatch === null && catalogSuggestion !== null ? (
            <button
              type="button"
              onClick={() => props.onUseCatalog(catalogSuggestion)}
              className="self-start text-[12.5px] text-fg underline underline-offset-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Use {catalogSuggestion.name} ({catalogSuggestion.domain}) from the catalog
            </button>
          ) : null}
        </div>
      ) : null}

      {needsDomainField ? (
        <Field
          id="add-brand-find-domain"
          label="Website"
          value={props.domain}
          onChange={(event) => props.onDomainChange(event.target.value)}
          placeholder="example.in"
          autoComplete="off"
          hint={
            domainShown !== "" && domainFieldError(domainShown) === null
              ? "The site this brand lives on."
              : input.inferredDomain
                ? "Guessed from the handle. Edit it if it is wrong."
                : "We could not tell the website from a name. Add it to continue."
          }
        />
      ) : null}

      {ambiguous.length > 0 ? (
        <div data-state="ambiguous" className="flex flex-col gap-3 rounded-sm border border-warn bg-bg-inset p-3">
          <p className="text-[13px] leading-[1.5] text-fg">
            This name overlaps a brand you already track. Pick the one you mean, or create a new profile.
          </p>
          <ul className="flex flex-col gap-2">
            {ambiguous.map((brand) => (
              <li
                key={String(brand._id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-bg-raised px-3 py-2"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[13.5px] text-fg">{brand.name}</span>
                  <span className={cn(VALUE_CLASS, "text-[11.5px] text-fg-tertiary")}>{brand.domain}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => props.onUseExisting(brand)}>
                  This one
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" className="self-start" onClick={props.onCreateNew}>
            Create &ldquo;{props.name}&rdquo; as a new profile
          </Button>
        </div>
      ) : null}

      {trackedBrand !== null ? (
        <div
          data-state="already-tracked"
          className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-bg-inset p-3"
        >
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-[13.5px] font-medium text-fg">Already tracked</span>
            <span className="text-[13px] text-fg-secondary">{trackedBrand.name} is already in your brands.</span>
            <span className="flex flex-wrap items-center gap-2">
              <Chip
                label={profileStatusLabel(trackedBrand.profileStatus)}
                tone={profileStatusTone(trackedBrand.profileStatus)}
              />
            </span>
          </span>
          <Link
            href={`/brands/${trackedBrand._id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border-strong px-3 text-[13px] text-fg hover:bg-bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Open profile
            <ArrowRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ReviewStep(props: {
  name: string;
  domain: string;
  vertical: string;
  aliases: string[];
  advertiserId: string;
  searchesLeft: number | null;
  gateReason: string | null;
  error: string | null;
}) {
  const rows: Array<[string, string]> = [
    ["Name", props.name],
    ["Website", props.domain],
    ["Category", categoryLabel(props.vertical)],
    ["Other names", props.aliases.length > 0 ? props.aliases.join(", ") : "None"],
    ["Ad account ID", props.advertiserId !== "" ? props.advertiserId : "Not set. We will try to find it from the website."],
  ];
  return (
    <div className="flex flex-col gap-4">
      <h3 tabIndex={-1} data-autofocus className="text-[13.5px] font-medium text-fg outline-none">
        This is what will be saved
      </h3>
      <dl className="flex flex-col gap-2.5 rounded-sm border border-border bg-bg-inset p-3 text-[13px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <dt className="w-28 shrink-0 text-[12.5px] text-fg-secondary">{label}</dt>
            <dd className={cn("min-w-0 break-words text-fg", label === "Website" && VALUE_CLASS)}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1 text-[12.5px] leading-[1.5] text-fg-secondary">
        <p>{addBrandCostLine(SEARCHES_PER_BRAND_ADD)}</p>
        <p>
          {props.searchesLeft === null
            ? "We could not read your search balance just now. You can still add the brand."
            : `You have ${props.searchesLeft} searches left this month.`}
        </p>
        {props.gateReason !== null ? (
          <p className="flex items-start gap-1.5 text-fg">
            <CircleAlert {...iconProps} size={14} aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            {props.gateReason}
          </p>
        ) : null}
      </div>
      {props.error !== null ? (
        <p role="alert" className="rounded-sm border border-danger px-3 py-2 text-[13px] leading-[1.5] text-danger">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}

function SuccessPanel({ name, brandId }: { name: string; brandId: string | null }) {
  return (
    <div role="status" className="flex flex-col items-start gap-2 py-4">
      <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-accent-dim text-accent">
        <Check {...iconProps} size={18} />
      </span>
      <h3 tabIndex={-1} data-autofocus className="text-[1.05rem] font-semibold text-fg outline-none">
        {name} added
      </h3>
      <p className="max-w-[44ch] text-[13px] leading-[1.5] text-fg-secondary">
        It is in your tracked brands. {brandId === null ? "" : "Open its profile to see what Drishti found."}
      </p>
    </div>
  );
}

function ProfileLink({ brandId }: { brandId: string | null }) {
  return (
    <Link
      href={brandId === null ? "/brands" : `/brands/${brandId}`}
      className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-3.5 text-[13px] font-medium text-accent-ink hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {brandId === null ? "View brands" : "Open profile"}
      <ArrowRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
    </Link>
  );
}
