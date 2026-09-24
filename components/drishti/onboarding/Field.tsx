"use client";


import type { InputHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_CLASS, iconProps } from "@/components/drishti";

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
      <label htmlFor={id} className={cn(LABEL_CLASS, "text-[var(--text-secondary,#667085)]")}>
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy.length > 0 ? describedBy.join(" ") : undefined}
        className={cn(
          "h-10 w-full rounded-[5px] border bg-[var(--bg-inset,#F1F3F0)] px-3 text-[14px] text-[var(--text-primary,#17191D)] outline-none",
          "motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out",
          "placeholder:text-[var(--text-tertiary,#98A2B3)]",
          invalid
            ? "border-[var(--danger,#DC2626)]"
            : "border-[var(--border-strong,#CBD2DC)] hover:border-[var(--text-tertiary,#98A2B3)]",
          "focus:border-[var(--accent,#0F766E)] focus:shadow-[0_0_0_3px_rgba(15,118,110,0.22)]",
          "disabled:cursor-not-allowed disabled:bg-[var(--bg-raised,#FFFFFF)] disabled:text-[var(--text-tertiary,#98A2B3)]",
        )}
      />
      {hint !== undefined && !invalid ? (
        <span id={`${id}-hint`} className="text-[12px] leading-[1.45] text-[var(--text-secondary,#667085)]">
          {hint}
        </span>
      ) : null}
      {invalid ? (
        <span
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-[12px] leading-[1.45] text-[var(--danger,#DC2626)]"
        >
          <CircleAlert {...iconProps} size={14} aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </span>
      ) : null}
    </div>
  );
}
