"use client";


import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FOCUS_RING_CLASS,
  PRESS_CLASS,
  STATE_TRANSITION_CLASS,
  iconProps,
} from "./tokens";

export type ButtonVariant = "primary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "disabled"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
};

export function buttonClasses(input: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
}): string {
  const variant = input.variant ?? "primary";
  const size = input.size ?? "md";
  const inactive = Boolean(input.loading || input.disabled);
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-sm border font-medium whitespace-nowrap",
    size === "sm" ? "h-8 px-3 text-[13px]" : "h-[38px] px-4 text-[13.5px]",
    "max-[899px]:min-h-11",
    input.fullWidth && "w-full",
    inactive
      ? "cursor-not-allowed border-border bg-bg-inset text-fg-tertiary"
      : input.error
        ? "cursor-pointer border-danger bg-transparent text-danger hover:bg-danger/10"
        : variant === "primary"
          ? "cursor-pointer border-accent bg-accent text-accent-ink hover:border-accent-strong hover:bg-accent-strong"
          : variant === "ghost"
            ? "cursor-pointer border-border-strong bg-transparent text-fg hover:bg-bg-inset"
            : "cursor-pointer border-danger bg-transparent text-danger hover:bg-danger/10",
    !inactive && PRESS_CLASS,
    !inactive && STATE_TRANSITION_CLASS,
    FOCUS_RING_CLASS,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  error = false,
  icon,
  iconRight,
  fullWidth = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const inactive = loading || disabled;
  const state = loading ? "loading" : disabled ? "disabled" : error ? "error" : "default";
  return (
    <button
      {...rest}
      type={type}
      disabled={inactive}
      aria-busy={loading || undefined}
      data-state={state}
      className={cn(
        buttonClasses({ variant, size, loading, disabled, error, fullWidth }),
        className,
      )}
    >
      {loading ? (
        <Loader2
          {...iconProps}
          size={16}
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
        />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
}
