"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { parseAccessRequest, type FieldErrors } from "@/convex/lib/accessRequestRules";
import { Field, FieldGroup, SubmitButton, DrawnCheck, type SubmitStatus } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const GENERIC_ERROR = "Something went wrong. Try again in a moment.";

export function RequestAccessForm({ onDone }: { onDone?: () => void }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

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
    try {
      await submit({ ...input, note: input.note || undefined, website: input.website || undefined });
      setStatus("success");
      setTimeout(() => setSent(input.email.trim()), SUCCESS_HOLD_MS);
    } catch (err) {
      setStatus("error");
    }
  }

  if (sent !== null) {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <span className="flex size-11 items-center justify-center rounded-full border border-border-strong text-fg">
          <DrawnCheck className="size-5" />
        </span>
        <div>
          <p className="text-xl font-semibold tracking-[-0.01em] text-fg">You&apos;re on the list</p>
          <p className="mt-2 max-w-[38ch] text-[15px] leading-6 text-fg-secondary">
            We read every request. When your workspace is ready, we will write to .
          </p>
        </div>
        {onDone ? (
          <Button type="button" variant="outline" className="h-10 border-border-strong px-4 text-[15px]" onClick={onDone}>
            Close
          </Button>
        ) : null}
      </div>
    );
  }
}
