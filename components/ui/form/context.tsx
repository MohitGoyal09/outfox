"use client";

import { createContext, useContext } from "react";

export type FieldContextValue = {
  id: string;
  describedBy?: string;
  invalid?: true;
  required?: true;
  disabled?: boolean;
};

export const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldControl(props: { id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling"; "aria-required"?: boolean | "true" | "false"; disabled?: boolean }) {
  const ctx = useContext(FieldContext);
  if (!ctx) return {};
  return {
    id: props.id ?? ctx.id,
    "aria-describedby": [props["aria-describedby"], ctx.describedBy].filter(Boolean).join(" ") || undefined,
    "aria-invalid": props["aria-invalid"] ?? ctx.invalid,
    "aria-required": props["aria-required"] ?? ctx.required,
    disabled: props.disabled ?? ctx.disabled,
  };
}
