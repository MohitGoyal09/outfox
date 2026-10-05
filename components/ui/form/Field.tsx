"use client";

import { useId, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldAria } from "./aria";
import { FieldContext } from "./context";

export function Field({
  label,
  optional,
  help,
  error,
  required,
  disabled,
  id,
  labelAction,
  className,
  children,
}: {
  label: ReactNode;
  optional?: boolean;
  help?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  labelAction?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const auto = useId();
  const base = id ?? auto;
  const shownHelp = error ? undefined : help;
  const aria = fieldAria({ id: base, help: shownHelp, error, required });
  return (
    <FieldContext.Provider value={{ id: base, describedBy: aria["aria-describedby"], invalid: aria["aria-invalid"], required: aria["aria-required"], disabled }}>
      <div className={cn("flex flex-col", className)} data-slot="field" data-invalid={error ? "" : undefined}>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor={base} className="text-[13px] font-medium leading-[18px] text-fg">
            {label}
            {optional ? <span className="ml-1 font-normal text-fg-tertiary">(optional)</span> : null}
          </label>
          {labelAction}
        </div>
        {children}
        <div className="min-h-[18px] pt-1 text-[13px] leading-[18px]">
          {error ? (
            <p id={`${base}-error`} role="alert" className="flex items-start gap-1.5 text-danger">
              <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          ) : shownHelp ? (
            <p id={`${base}-help`} className="text-fg-secondary">
              {shownHelp}
            </p>
          ) : null}
        </div>
      </div>
    </FieldContext.Provider>
  );
}
