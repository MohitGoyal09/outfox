"use client";


import type { InputHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING_CLASS, LABEL_CLASS, iconProps } from "@/components/drishti";

export type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  className?: string;
};

export function Field({ id, label, error = null, hint, className, ...rest }: FieldProps) {
  const invalid = error !== null && error !== "";
  const describedBy: string[] = [];
  if (hint !== undefined) describedBy.push(`${id}-hint`);
  if (invalid) describedBy.push(`${id}-error`);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn(LABEL_CLASS, "text-[var(--text-secondary)]")}>
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy.length > 0 ? describedBy.join(" ") : undefined}
        className={cn(
          "h-10 w-full rounded-sm border bg-[var(--bg-inset)] px-3 text-[14px] text-[var(--text-primary)] outline-none",
          "motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out",
          "placeholder:text-[var(--text-tertiary)]",
          invalid
            ? "border-[var(--danger)]"
            : "border-[var(--border-strong)] hover:border-[var(--text-tertiary)]",
          "focus:border-[var(--border-strong)]",
          FOCUS_RING_CLASS,
          "disabled:cursor-not-allowed disabled:bg-[var(--bg-raised)] disabled:text-[var(--text-tertiary)]",
        )}
      />
      {hint !== undefined && !invalid ? (
        <span id={`${id}-hint`} className="text-[12px] leading-[1.45] text-[var(--text-secondary)]">
          {hint}
        </span>
      ) : null}
      {invalid ? (
        <span
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-[12px] leading-[1.45] text-[var(--danger)]"
        >
          <CircleAlert {...iconProps} size={14} aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </span>
      ) : null}
    </div>
  );
}
