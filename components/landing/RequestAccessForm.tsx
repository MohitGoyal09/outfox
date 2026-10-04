"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { parseAccessRequest, type FieldErrors } from "@/convex/lib/accessRequestRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const GENERIC_ERROR = "Something went wrong. Try again in a moment.";

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function RequestAccessForm({ onDone }: { onDone?: () => void }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    const input = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      company: String(data.get("company") ?? ""),
      note: String(data.get("note") ?? ""),
      website: String(data.get("website") ?? ""),
    };
    const parsed = parseAccessRequest(input);
    if (parsed.kind === "invalid") {
      setErrors(parsed.errors);
      setFormError(null);
      return;
    }
    setErrors({});
    setFormError(null);
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start gap-3">
        <p className="text-sm text-foreground">Thanks. We will be in touch.</p>
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Close
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ra-name">Name</Label>
        
        <FieldError id="ra-name-error" message={errors.name} />
      </div>
      <div className="flex flex-col gap-1.5">
        
        <Input
          id="ra-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "ra-email-error" : undefined}
        />
        <FieldError id="ra-email-error" message={errors.email} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ra-company">Company</Label>
        <Input
          id="ra-company"
          name="company"
          autoComplete="organization"
          required
          maxLength={120}
          aria-invalid={errors.company ? true : undefined}
          aria-describedby={errors.company ? "ra-company-error" : undefined}
        />
        
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ra-note">Anything we should know? (optional)</Label>
        <Textarea
          id="ra-note"
          name="note"
          rows={3}
          maxLength={500}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={errors.note ? "ra-note-error" : undefined}
        />
        <FieldError id="ra-note-error" message={errors.note} />
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}
      
    </form>
  );
}
