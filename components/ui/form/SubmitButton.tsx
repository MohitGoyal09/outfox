"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DrawnCheck } from "./DrawnCheck";

export type SubmitStatus = "idle" | "pending" | "success" | "error";

const DEFAULT_LABELS = { idle: "Submit", pending: "Sending…", success: "Sent", error: "Try again" } satisfies Record<SubmitStatus, string>;

export function SubmitButton({
  status,
  labels,
  className,
  ...props
}: { status: SubmitStatus; labels?: Partial<Record<SubmitStatus, string>> } & Omit<ComponentProps<typeof Button>, "children" | "loading" | "disabled">) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const label = text[status];
  return (
    <>
      <Button
        {...props}
        loading={status === "pending"}
        disabled={status === "pending" || status === "success"}
        data-status={status}
        className={cn("h-10 min-w-36 px-4 text-[15px] disabled:opacity-100 motion-safe:data-[status=error]:animate-[field-shake_320ms_ease-out]", className)}
      >
        {status === "success" ? <DrawnCheck /> : null}
        <span>{label}</span>
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {status === "idle" ? "" : label}
      </span>
    </>
  );
}
