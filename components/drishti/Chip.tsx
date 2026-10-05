"use client";


import type { MouseEvent, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FOCUS_RING_CLASS,
  LABEL_CLASS,
  PRESS_CLASS,
  STATE_TRANSITION_CLASS,
  iconProps,
  isValidEvidenceHref,
  resolveDotColor,
  TONE_COLOR,
  type ScaleKind,
  type Tone,
} from "./tokens";

export type ChipVariant = "neutral" | "status" | "you";

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
  variant?: ChipVariant;
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
  variant = "neutral",
  size = "sm",
  title,
  className,
}: ChipProps) {
  const flags = chipStateFlags({ href, onClick, pressed, disabled, loading, error });
  const dotColor = resolveDotColor({ tone, value, scale });
  const text = children ?? label ?? value ?? "";

  const classes = cn(
    LABEL_CLASS,
    "min-h-5 text-xs relative inline-flex items-center gap-1.5 rounded-full border bg-bg-inset whitespace-nowrap",
    size === "sm" ? "h-5 px-2" : "h-6 px-2.5",
    flags.invalid
      ? "border-danger text-danger"
      : variant === "you"
        ? "border-accent bg-accent text-accent-ink"
        : variant === "status" && tone && tone !== "neutral"
          ? "bg-bg-raised"
          : "border-border text-fg-secondary",
    flags.interactive &&
      "cursor-pointer hover:border-border-strong hover:bg-bg-raised hover:text-fg",
    flags.interactive && PRESS_CLASS,
    flags.interactive && STATE_TRANSITION_CLASS,
    flags.interactive && FOCUS_RING_CLASS,
    flags.selected &&
      "bg-bg-raised-2 text-fg ring-1 ring-accent",
    !flags.interactive &&
      (disabled || loading) &&
      "cursor-not-allowed text-fg-tertiary",
    flags.interactive &&
      "after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] after:hidden max-[899px]:after:block",
    className,
  );

  const statusStyle =
    variant === "status" && tone && tone !== "neutral" && !flags.invalid
      ? { color: TONE_COLOR[tone], borderColor: `color-mix(in srgb, ${TONE_COLOR[tone]} 40%, var(--border))` }
      : undefined;

  const inner = (
    <>
      {flags.busy ? (
        <Loader2
          {...iconProps}
          size={14}
          aria-hidden="true"
          className="size-3 animate-spin text-fg-tertiary motion-reduce:animate-none"
        />
      ) : dot && variant !== "you" ? (
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
        style={statusStyle}
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
        style={statusStyle}
        className={classes}
      >
        {inner}
      </button>
    );
  }

  return (
    <span title={title} data-state={state} style={statusStyle} className={classes}>
      {inner}
    </span>
  );
}
