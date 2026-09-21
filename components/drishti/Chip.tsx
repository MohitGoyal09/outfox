"use client";


import type { MouseEvent, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LABEL_CLASS,
  PRESS_CLASS,
  STATE_TRANSITION_CLASS,
  iconProps,
  isValidEvidenceHref,
  resolveDotColor,
  type ScaleKind,
  type Tone,
} from "./tokens";

export type ChipProps = {
  label?: string;
  children?: ReactNode;
  tone?: Tone;
  value?: string;
  scale?: ScaleKind;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  pressed?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  dot?: boolean;
  size?: "sm" | "md";
  title?: string;
  className?: string;
};

export type ChipStateFlags = {
  interactive: boolean;
  busy: boolean;
  invalid: boolean;
  selected: boolean;
  link: string | null;
};

export function chipStateFlags(props: {
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  pressed?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
}): ChipStateFlags {
  const loading = Boolean(props.loading);
  const disabled = Boolean(props.disabled);
  const interactive = Boolean(props.href || props.onClick) && !disabled && !loading;
  return {
    interactive,
    busy: loading,
    invalid: Boolean(props.error),
    selected: Boolean(props.pressed),
    link: isValidEvidenceHref(props.href) ? props.href.trim() : null,
  };
}

export function Chip({
  label,
  children,
  tone,
  value,
  scale,
  href,
  onClick,
  pressed = false,
  disabled = false,
  loading = false,
  error = false,
  dot = true,
  size = "sm",
  title,
  className,
}: ChipProps) {
  const flags = chipStateFlags({ href, onClick, pressed, disabled, loading, error });
  const dotColor = resolveDotColor({ tone, value, scale });
  const text = children ?? label ?? value ?? "";

  const classes = cn(
    LABEL_CLASS,
    "relative inline-flex items-center gap-1.5 rounded-full border bg-[var(--bg-inset,#0e0e13)] whitespace-nowrap",
    size === "sm" ? "h-5 px-2" : "h-6 px-2.5",
    flags.invalid
      ? "border-[var(--danger,#f87171)] text-[var(--danger,#f87171)]"
      : "border-[var(--border-strong,#35353f)] text-[var(--text-secondary,#9797a3)]",
    flags.interactive &&
      "cursor-pointer hover:border-[var(--text-tertiary,#64646f)] hover:bg-[var(--bg-raised,#131319)] hover:text-[var(--text-primary,#eeeef2)]",
    flags.interactive && PRESS_CLASS,
    flags.interactive && STATE_TRANSITION_CLASS,
    flags.interactive &&
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#e2a339)] focus-visible:ring-[3px] focus-visible:ring-[rgba(226,163,57,0.22)]",
    flags.selected &&
      "bg-[var(--bg-raised-2,#191922)] text-[var(--text-primary,#eeeef2)] ring-1 ring-[var(--accent,#e2a339)]",
    !flags.interactive &&
      (disabled || loading) &&
      "cursor-not-allowed text-[var(--text-tertiary,#64646f)]",
    flags.interactive &&
      "after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] after:hidden max-[899px]:after:block",
    className,
  );

  const inner = (
    <>
      {flags.busy ? (
        <Loader2
          {...iconProps}
          size={14}
          aria-hidden="true"
          className="size-3 animate-spin text-[var(--text-tertiary,#64646f)] motion-reduce:animate-none"
        />
      ) : dot ? (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      <span>{text}</span>
      {flags.invalid ? <span className="sr-only">invalid value</span> : null}
    </>
  );

  const state = flags.invalid
    ? "error"
    : flags.busy
      ? "loading"
      : flags.selected
        ? "pressed"
        : disabled
          ? "disabled"
          : "default";

  if (flags.link && !disabled && !loading) {
    return (
      <a
        href={flags.link}
        target="_blank"
        rel="noreferrer noopener"
        title={title}
        aria-current={flags.selected ? "true" : undefined}
        data-state={state}
        className={classes}
      >
        {inner}
      </a>
    );
  }

  if (href || onClick) {
    return (
      <button
        type="button"
        title={title}
        disabled={disabled || loading}
        aria-pressed={flags.selected}
        aria-busy={flags.busy || undefined}
        onClick={onClick}
        data-state={state}
        className={classes}
      >
        {inner}
      </button>
    );
  }

  return (
    <span title={title} data-state={state} className={classes}>
      {inner}
    </span>
  );
}
