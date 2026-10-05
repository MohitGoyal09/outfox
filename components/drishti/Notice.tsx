"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconProps } from "./tokens";

export type NoticeProps = {
  tone?: "info" | "warn";
  title: ReactNode;
  children?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  defaultOpen?: boolean;
  className?: string;
};

export function Notice({
  tone = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  defaultOpen = false,
  className,
}: NoticeProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const iconClass = cn("mt-0.5 size-4 shrink-0", tone === "warn" ? "text-warn" : "text-fg-tertiary");
  return (
    <div
      role={tone === "warn" ? "alert" : "status"}
      className={cn("rounded-lg border border-border bg-bg-inset px-4 py-3", className)}
    >
      <div className="flex items-start gap-3">
        {tone === "warn" ? (
          <TriangleAlert {...iconProps} aria-hidden="true" className={iconClass} />
        ) : (
          <Info {...iconProps} aria-hidden="true" className={iconClass} />
        )}
        <p className="min-w-0 flex-1 text-sm text-fg">{title}</p>
        {children ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-fg-secondary hover:text-fg"
          >
            Details
            <ChevronDown {...iconProps} aria-hidden="true" className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </button>
        ) : null}
        {dismissible ? (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => {
              setGone(true);
              onDismiss?.();
            }}
            className="shrink-0 text-fg-tertiary hover:text-fg"
          >
            <X {...iconProps} aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
      {children && open ? (
        <div className="mt-2 space-y-2 pl-7 text-sm text-fg-secondary">{children}</div>
      ) : null}
    </div>
  );
}
