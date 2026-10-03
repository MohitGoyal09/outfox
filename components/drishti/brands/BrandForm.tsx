"use client";


import { useId, useMemo, useState } from "react";
import { ArrowRight, Building2, Link2, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { Panel } from "../Panel";
import { LABEL_CLASS, PRESS_CLASS, VALUE_CLASS, iconProps } from "../tokens";
import { TextField } from "./TextField";
import {
  adsTransparencyLabel,
  formatStamp,
  parseRivalInput,
  profileStatusLabel,
  profileStatusTone,
  resolveRival,
  type BrandDoc,
} from "../cohorts/cohorts-model";

export type BrandFormValues = {
  name: string;
  domain: string;
  vertical: string;
  aliases: string[];
  adsTransparencyAdvertiserId?: string;
};

export type BrandCreatePath = "shared" | "manual";

export type BrandFormProps = {
  existingBrands: BrandDoc[];
  onSubmit: (values: BrandFormValues, path: BrandCreatePath) => Promise<boolean>;
  isSaving?: boolean;
  error?: string | null;
  success?: string | null;
  defaults?: Partial<BrandFormValues>;
  defaultVertical?: string;
  framed?: boolean;
  className?: string;
};

export type BrandFieldErrors = {
  name: string | null;
  domain: string | null;
  vertical: string | null;
};

export function validateBrandFields(input: {
  name: string;
  domain: string;
  vertical: string;
}): BrandFieldErrors {
  const name = input.name.trim();
  const domain = input.domain.trim();
  const vertical = input.vertical.trim();
  return {
    name: name === "" ? "Enter a rival name, or paste its URL." : null,
    domain:
      domain === ""
        ? "Enter the domain the rival's site resolves to."
        : domain.includes(".")
          ? null
          : "A domain needs a dot, for example example.in.",
    vertical: vertical === "" ? "Name the vertical this rival competes in." : null,
  };
}

export function hasBrandFieldErrors(errors: BrandFieldErrors): boolean {
  return errors.name !== null || errors.domain !== null || errors.vertical !== null;
}

function parseAliases(raw: string): string[] {
  return [...new Set(
    raw
      .split(",")
      .map((alias) => alias.trim())
      .filter((alias) => alias !== ""),
  )];
}

export function BrandForm({
  existingBrands,
  onSubmit,
  isSaving = false,
  error = null,
  success = null,
  defaults,
  defaultVertical,
  framed = true,
  className,
}: BrandFormProps) {
  const uid = useId();
  const [query, setQuery] = useState(defaults?.name ?? "");
  const [domain, setDomain] = useState(defaults?.domain ?? "");
  const [domainEdited, setDomainEdited] = useState(defaults?.domain !== undefined);
  const [vertical, setVertical] = useState(
    defaults?.vertical ?? defaultVertical ?? "skincare/beauty",
  );
  const [aliases, setAliases] = useState((defaults?.aliases ?? []).join(", "));
  const [advertiserId, setAdvertiserId] = useState(
    defaults?.adsTransparencyAdvertiserId ?? "",
  );
  const [path, setPath] = useState<BrandCreatePath>("shared");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [forceNew, setForceNew] = useState(false);

  const input = useMemo(() => parseRivalInput(query), [query]);
  const resolution = useMemo(
    () => resolveRival(input, existingBrands),
    [input, existingBrands],
  );

  const confirmedCandidate =
    confirmedId === null
      ? null
      : existingBrands.find((brand) => String(brand._id) === confirmedId) ?? null;
  const trackedBrand =
    confirmedCandidate ??
    (resolution.state === "already_tracked" ? resolution.brand : null);
  const ambiguous =
    confirmedCandidate === null &&
    !forceNew &&
    resolution.state === "ambiguous"
      ? resolution.candidates
      : [];

  const effectiveName = input.name.trim();
  const effectiveDomain = domain.trim();
  const fieldErrors = validateBrandFields({
    name: effectiveName,
    domain: effectiveDomain,
    vertical,
  });
  const showError = (field: keyof BrandFieldErrors): string | null =>
    submitted || touched[field] ? fieldErrors[field] : null;

  const blockedByAmbiguity = ambiguous.length > 0;
  const blockedByTracking = trackedBrand !== null;
  const disabled = isSaving || blockedByAmbiguity || blockedByTracking;

  function onQueryChange(value: string) {
    setQuery(value);
    setConfirmedId(null);
    setForceNew(false);
    const parsed = parseRivalInput(value);
    if (!domainEdited && parsed.domain !== null) setDomain(parsed.domain);
  }

  function pickCandidate(brand: BrandDoc) {
    setConfirmedId(String(brand._id));
    setForceNew(false);
    setQuery(brand.name);
    setDomain(brand.domain);
    setDomainEdited(true);
    setVertical(brand.vertical);
  }

  function resetFields() {
    setQuery("");
    setDomain("");
    setDomainEdited(false);
    setVertical(defaultVertical ?? "skincare/beauty");
    setAliases("");
    setAdvertiserId("");
    setSubmitted(false);
    setTouched({});
    setConfirmedId(null);
    setForceNew(false);
  }

  async function submit() {
    setSubmitted(true);
    if (hasBrandFieldErrors(fieldErrors)) return;
    if (blockedByAmbiguity || blockedByTracking) return;

    const values: BrandFormValues = {
      name: effectiveName,
      domain: effectiveDomain,
      vertical: vertical.trim(),
      aliases: parseAliases(aliases),
      ...(advertiserId.trim() !== ""
        ? { adsTransparencyAdvertiserId: advertiserId.trim() }
        : {}),
    };
    const created = await onSubmit(values, path);
    if (created) resetFields();
  }

  const preview = (
    <dl className="flex flex-col gap-2 text-[13px]">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <dt className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>
          domain
        </dt>
        <dd className={cn(VALUE_CLASS, "text-[var(--text-primary)]")}>
          {effectiveDomain === "" ? "not resolved yet" : effectiveDomain}
        </dd>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <dt className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>
          vertical
        </dt>
        <dd className="text-[var(--text-primary)]">
          {vertical.trim() === "" ? "not set" : vertical.trim()}
        </dd>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <dt className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>
          ads transparency
        </dt>
        <dd className="text-[var(--text-secondary)]">
          {adsTransparencyLabel(confirmedCandidate)}
        </dd>
      </div>
    </dl>
  );

  const content = (
    <>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--bg-inset)] text-[var(--text-tertiary)]"
        >
          <Building2 {...iconProps} size={16} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[1.05rem] font-semibold leading-[1.32] text-[var(--text-primary)]">
            Add a rival
          </h3>
          <p className="mt-1 max-w-[68ch] text-[13px] leading-[1.5] text-[var(--text-secondary)]">
            Paste a URL, type a handle, or search a name. The domain it resolves
            to is shown before anything is saved.
          </p>
        </div>
      </div>

      <TextField
        id={`${uid}-query`}
        label="Rival"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
        placeholder="mamaearth.in, @minimalist, or Plum"
        autoComplete="off"
        error={showError("name")}
        hint={
          input.kind === "url"
            ? "Read as a URL."
            : input.kind === "handle"
              ? "Read as a handle; the domain below is inferred and editable."
              : input.kind === "name"
                ? "Read as a name."
                : "Paste a URL, a handle, or a name."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${uid}-domain`}
          label="Domain"
          value={domain}
          onChange={(event) => {
            setDomain(event.target.value);
            setDomainEdited(true);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, domain: true }))}
          placeholder="mamaearth.in"
          mono
          autoComplete="off"
          error={showError("domain")}
          {...(input.inferredDomain
            ? { hint: "Inferred from the handle. Edit it if it is wrong." }
            : {})}
        />
        <TextField
          id={`${uid}-vertical`}
          label="Vertical"
          value={vertical}
          onChange={(event) => setVertical(event.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, vertical: true }))}
          placeholder="skincare/beauty"
          autoComplete="off"
          error={showError("vertical")}
        />
        <TextField
          id={`${uid}-aliases`}
          label="Aliases (comma separated)"
          value={aliases}
          onChange={(event) => setAliases(event.target.value)}
          placeholder="mama earth, mse"
          autoComplete="off"
          hint="Optional. Names the same rival also appears under."
        />
        <TextField
          id={`${uid}-advertiser`}
          label="Ads Transparency advertiser id"
          value={advertiserId}
          onChange={(event) => setAdvertiserId(event.target.value)}
          placeholder="AR_123"
          mono
          autoComplete="off"
          hint="Optional. Left blank, we try to resolve one from the domain; if that fails, Ads Transparency reports unavailable."
        />
      </div>

      <div className="rounded-sm border border-dashed border-[var(--border)] bg-[var(--bg-inset)] p-3">
        <span className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>
          preview
        </span>
        <div className="mt-2">{preview}</div>
      </div>

      {ambiguous.length > 0 ? (
        <div
          data-state="ambiguous"
          className="flex flex-col gap-3 rounded-sm border border-[var(--warn)] bg-[var(--bg-inset)] p-3"
        >
          <p className="text-[13px] leading-[1.5] text-[var(--text-primary)]">
            Names overlap a tracked brand. Confirm which one this is, or create a
            new profile.
          </p>
          <ul className="flex flex-col gap-2">
            {ambiguous.map((brand) => (
              <li
                key={String(brand._id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[13.5px] text-[var(--text-primary)]">
                    {brand.name}
                  </span>
                  <span className={cn(VALUE_CLASS, "text-[11.5px] text-[var(--text-tertiary)]")}>
                    {brand.domain}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => pickCandidate(brand)}
                >
                  Use this
                </Button>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => {
              setForceNew(true);
              setConfirmedId(null);
            }}
          >
            Create {effectiveName === "" ? "a new rival" : `"${effectiveName}"`} as a new profile
          </Button>
        </div>
      ) : null}

      {trackedBrand !== null ? (
        <div
          data-state="already-tracked"
          className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[var(--border)] bg-[var(--bg-inset)] p-3"
        >
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-[13.5px] text-[var(--text-primary)]">
              {trackedBrand.name} is already tracked.
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Chip
                label={profileStatusLabel(trackedBrand.profileStatus)}
                tone={profileStatusTone(trackedBrand.profileStatus)}
              />
              <span className={cn(VALUE_CLASS, "text-[11.5px] text-[var(--text-tertiary)]")}>
                added {formatStamp(trackedBrand.createdAt)}
              </span>
            </span>
          </span>
          <Link
            href={`/brands/${trackedBrand._id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-[var(--border-strong)] px-3 text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Open profile
            <ArrowRight {...iconProps} size={14} aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>
          create path
        </legend>
        <div
          role="radiogroup"
          aria-label="Create path"
          className="inline-flex w-fit items-center gap-1 rounded-full bg-[var(--bg-inset)] p-[3px]"
        >
          {(
            [
              { id: "shared", label: "Shared path" },
              { id: "manual", label: "Manual record" },
            ] as const
          ).map((option) => {
            const active = option.id === path;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={isSaving}
                onClick={() => setPath(option.id)}
                className={cn(
                  "inline-flex h-7 items-center rounded-full px-3 text-[12.5px] font-medium",
                  "max-[899px]:min-h-11",
                  active
                    ? "bg-accent text-accent-ink"
                    : cn(
                        "cursor-pointer bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        PRESS_CLASS,
                      ),
                  "motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="max-w-[68ch] text-[12px] leading-[1.45] text-[var(--text-secondary)]">
          {path === "shared"
            ? "Same path the agent uses. Saves the profile ready to compare."
            : "Saves a pending record the next check fills in. Both paths create the same kind of record."}
        </p>
      </fieldset>

      {error !== null ? (
        <p
          role="alert"
          className="rounded-sm border border-[var(--danger)] px-3 py-2 text-[13px] leading-[1.5] text-[var(--danger)]"
        >
          {error}
        </p>
      ) : null}
      {success !== null ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--bg-inset)] px-3 py-2 text-[13px] leading-[1.5] text-[var(--text-primary)]"
        >
          <Link2 {...iconProps} size={14} aria-hidden="true" className="size-3.5 text-[var(--ok)]" />
          {success}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => void submit()}
          loading={isSaving}
          disabled={disabled}
          icon={<Search {...iconProps} size={16} />}
        >
          {error !== null ? "Retry create" : "Confirm rival"}
        </Button>
        {blockedByTracking ? (
          <span className="text-[12.5px] text-[var(--text-secondary)]">
            This rival is already tracked. Nothing to create.
          </span>
        ) : blockedByAmbiguity ? (
          <span className="text-[12.5px] text-[var(--text-secondary)]">
            Confirm a candidate, or choose to create a new profile.
          </span>
        ) : (
          <span className="text-[12.5px] text-[var(--text-secondary)]">
            Writes one BrandProfile through the chosen path.
          </span>
        )}
      </div>
    </>
  );

  if (!framed) {
    return (
      <section
        aria-label="Add a rival"
        className={cn("flex flex-col gap-4", className)}
      >
        {content}
      </section>
    );
  }

  return (
    <Panel
      as="section"
      interactive={false}
      padded
      ariaLabel="Add a rival"
      className={cn("flex flex-col gap-4", className)}
    >
      {content}
    </Panel>
  );
}
