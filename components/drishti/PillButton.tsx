import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function pillClasses(variant: "ink" | "outline" = "ink", size: "sm" | "md" = "md"): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full border font-medium whitespace-nowrap",
    "transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "h-8 px-3.5 text-[13px]" : "h-10 px-5 text-sm",
    variant === "ink"
      ? "border-accent bg-accent text-accent-ink hover:bg-accent-strong"
      : "border-border-strong bg-bg-raised text-fg hover:bg-bg-inset",
  );
}

export type PillButtonProps = ComponentProps<"button"> & {
  variant?: "ink" | "outline";
  size?: "sm" | "md";
};

export function PillButton({ variant = "ink", size = "md", className, type = "button", ...props }: PillButtonProps) {
  return <button type={type} className={cn(pillClasses(variant, size), className)} {...props} />;
}
