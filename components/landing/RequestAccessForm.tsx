"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { parseAccessRequest, type FieldErrors } from "@/convex/lib/accessRequestRules";
import { StatefulButton, type ButtonStatus } from "@/components/aceternity/stateful-button";
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

export function RequestAccessForm({ onDone, tone = "light" }: { onDone?: () => void; tone?: "light" | "ink" }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<ButtonStatus>("idle");
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
    try {
      await submit({ ...input, note: input.note || undefined, website: input.website || undefined });
      setStatus("success");
      setTimeout(() => setSent(true), SUCCESS_HOLD_MS);
    } catch (err) {
      setStatus("idle");
    }
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
}
