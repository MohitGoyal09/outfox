"use client";


import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESS_CLASS, STATE_TRANSITION_CLASS, iconProps } from "./tokens";

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
    "inline-flex items-center justify-center gap-2 rounded-[5px] border font-medium whitespace-nowrap",
    size === "sm" ? "h-8 px-3 text-[13px]" : "h-[38px] px-4 text-[13.5px]",
    "max-[899px]:min-h-11",
    input.fullWidth && "w-full",
    inactive
      ? "cursor-not-allowed border-[var(--border,#24242f)] bg-[var(--bg-inset,#0e0e13)] text-[var(--text-tertiary,#64646f)]"
      : input.error
        ? "cursor-pointer border-[var(--danger,#f87171)] bg-transparent text-[var(--danger,#f87171)] hover:bg-[rgba(248,113,113,0.12)]"
        : variant === "primary"
          ? "cursor-pointer border-[var(--accent,#e2a339)] bg-[var(--accent,#e2a339)] text-[var(--accent-ink,#1a1204)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:border-[var(--accent-strong,#f0b552)] hover:bg-[var(--accent-strong,#f0b552)]"
          : variant === "ghost"
            ? "cursor-pointer border-[var(--border-strong,#35353f)] bg-transparent text-[var(--text-primary,#eeeef2)] hover:border-[var(--text-tertiary,#64646f)] hover:bg-[var(--bg-raised,#131319)]"
            : "cursor-pointer border-[var(--danger,#f87171)] bg-transparent text-[var(--danger,#f87171)] hover:bg-[rgba(248,113,113,0.12)]",
    !inactive && PRESS_CLASS,
    !inactive && STATE_TRANSITION_CLASS,
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)] focus-visible:ring-[3px] focus-visible:ring-[rgba(226,163,57,0.22)]",
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
