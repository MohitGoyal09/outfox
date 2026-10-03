"use client";


import type { InputHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconProps } from "@/components/drishti";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <Label htmlFor={id} className="text-[var(--text-secondary)]">
        {label}
      </Label>
      <Input
        {...rest}
        id={id}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy.length > 0 ? describedBy.join(" ") : undefined}
        className="h-11 text-[14px]"
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
