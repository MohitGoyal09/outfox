"use client";


import type { InputHTMLAttributes, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING_CLASS, LABEL_CLASS, iconProps } from "../tokens";

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className"
> & {
  id: string;
  label: string;
  error?: string | null;
  hint?: ReactNode;
  mono?: boolean;
  className?: string;
};

export function TextField({
  id,
  label,
  error = null,
  hint,
  mono = false,
  className,
  ...rest
}: TextFieldProps) {
  const describedBy: string[] = [];
  if (hint !== undefined) describedBy.push(`${id}-hint`);
  if (error !== null && error !== "") describedBy.push(`${id}-error`);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(LABEL_CLASS, "text-fg-tertiary")}
      >
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={error !== null && error !== "" ? true : undefined}
        aria-describedby={describedBy.length > 0 ? describedBy.join(" ") : undefined}
        className={cn(
          "h-9 w-full rounded-sm border bg-bg-inset px-2.5 text-[13.5px] text-fg outline-none",
          "max-[899px]:min-h-11",
          "motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out",
          mono ? "font-mono tabular-nums" : "font-sans",
          error !== null && error !== ""
            ? "border-danger"
            : "border-border-strong hover:border-fg-tertiary",
          "focus:border-accent",
          FOCUS_RING_CLASS,
          "disabled:cursor-not-allowed disabled:border-border disabled:bg-bg-raised disabled:text-fg-tertiary disabled:hover:border-border",
        )}
      />
      {hint !== undefined && (error === null || error === "") ? (
        <span
          id={`${id}-hint`}
          className="text-[12px] leading-[1.45] text-fg-secondary"
        >
          {hint}
        </span>
      ) : null}
      {error !== null && error !== "" ? (
        <span
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-[12px] leading-[1.45] text-danger"
        >
          <CircleAlert
            {...iconProps}
            size={14}
            aria-hidden="true"
            className="size-3.5 shrink-0"
          />
          {error}
        </span>
      ) : null}
    </div>
  );
}
