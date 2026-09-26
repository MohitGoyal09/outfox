"use client";


import { useState, type FormEvent } from "react";
import { Panel, Button, iconProps } from "@/components/drishti";
import { ArrowRight, CircleAlert, Compass } from "lucide-react";
import { Field } from "./Field";
import { validateBrandDraft, type BrandDraft, type BrandDraftErrors } from "./onboarding-model";

export function Step1YourBrand({
  draft,
  onChange,
  onSubmit,
  submitting,
  submitError,
}: {
  draft: BrandDraft;
  onChange: (next: BrandDraft) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const [touched, setTouched] = useState(false);
  const errors: BrandDraftErrors = touched ? validateBrandDraft(draft) : {};

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    const validation = validateBrandDraft(draft);
    if (validation.name !== undefined || validation.domain !== undefined) return;
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Panel as="section" interactive={false} padded ariaLabel="Your brand">
        <div className="mb-4 flex items-start gap-2.5 rounded-[6px] border border-[var(--border)] bg-[var(--bg-inset)] px-3 py-2.5">
          <Compass {...iconProps} size={16} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
          <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
            This becomes the baseline every comparison reads against — every rival you add
            later is measured next to it, not the other way around.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Field
            id="brand-name"
            label="Brand name"
            placeholder="e.g. Minimalist"
            autoFocus
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            error={errors.name}
          />
          <Field
            id="brand-domain"
            label="Website"
            placeholder="e.g. beminimalist.co"
            value={draft.domain}
            onChange={(event) => onChange({ ...draft, domain: event.target.value })}
            error={errors.domain}
            hint="Just the domain — no need for https:// or www."
          />
        </div>
      </Panel>

      {submitError !== null ? (
        <p role="alert" className="flex items-start gap-1.5 text-[13px] leading-[1.5] text-[var(--danger)]">
          <CircleAlert {...iconProps} size={14} aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        loading={submitting}
        iconRight={<ArrowRight {...iconProps} size={14} />}
        className="self-start"
      >
        Continue
      </Button>
    </form>
  );
}
