"use client";


import { useState } from "react";
import { Field, FieldGroup, SubmitButton, controlClass, useFieldControl, type SubmitStatus } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SelectControl() {
  const field = useFieldControl({});
  return (
    <Select defaultValue="agency">
      <SelectTrigger {...field} className={cn(controlClass, "h-10 w-full")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="agency">Agency</SelectItem>
        <SelectItem value="brand">In-house brand</SelectItem>
      </SelectContent>
    </Select>
  );
}

function Panel({ title, ink }: { title: string; ink?: boolean }) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [showErrors, setShowErrors] = useState(false);
  const run = (next: SubmitStatus) => {
    setStatus(next);
    if (next === "pending") setTimeout(() => setStatus("success"), 1200);
  };
  return (
    <section aria-label={title} className={cn("rounded-2xl border border-border p-6 sm:p-8", ink ? "l-ink bg-[var(--ink-base)]" : "bg-bg-raised")}>
      <h2 className="mb-6 text-lg font-semibold text-fg">{title}</h2>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Field label="Default" help="Help text sits here.">
          <Input placeholder="Placeholder" />
        </Field>
        <Field label="Filled">
          <Input defaultValue="Ada Lovelace" />
        </Field>
        <Field label="Invalid" error={showErrors ? "Enter a work email like you@company.com." : undefined} required>
          <Input type="email" defaultValue="not-an-email" />
        </Field>
        <Field label="Disabled" disabled>
          <Input defaultValue="Locked value" />
        </Field>
        <Field label="Note" optional help="Up to 500 characters.">
          <Input placeholder="Optional field" />
        </Field>
        <Field label="Small (32px)">
          <Input size="sm" placeholder="Compact" />
        </Field>
        <Field label="Role">
          <SelectControl />
        </Field>
        <Field label="Textarea" optional help="Grows as you type.">
          <Textarea placeholder="Anything we should know?" />
        </Field>
      </div>
      <div className="mt-6 border-t border-border pt-6">
        <FieldGroup
          legend="Field group"
          actions={
            <>
              <Button type="button" variant="outline" className="h-10 border-border-strong px-4 text-[15px]" onClick={() => setShowErrors((v) => !v)}>
                {showErrors ? "Clear errors" : "Show errors"}
              </Button>
              <SubmitButton type="button" status={status} labels={{ idle: "Request access", pending: "Sending…", success: "Sent", error: "Try again" }} onClick={() => run("pending")} />
            </>
          }
        >
          <Field label="First name">
            <Input autoComplete="off" />
          </Field>
          <Field label="Last name">
            <Input autoComplete="off" />
          </Field>
        </FieldGroup>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Trigger button state">
          {(["idle", "pending", "success", "error"] as const).map((s) => (
            <Button key={s} type="button" size="sm" variant="outline" className="border-border-strong" onClick={() => setStatus(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FormsHarness() {
  return (
    <main className="l-theme min-h-dvh px-4 py-10 text-fg sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <h1 className="text-2xl font-semibold">Form system</h1>
        <Panel title="Light" />
        <Panel title="Dark (.l-ink)" ink />
      </div>
    </main>
  );
}
