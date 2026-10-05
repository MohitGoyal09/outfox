"use client";


import type { InputHTMLAttributes } from "react";
import { Field as FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  className?: string;
};

export function Field({ id, label, error = null, hint, className, ...rest }: FieldProps) {
  return (
    <FormField id={id} label={label} help={hint} error={error ? error : undefined} className={className}>
      <Input {...rest} />
    </FormField>
  );
}
