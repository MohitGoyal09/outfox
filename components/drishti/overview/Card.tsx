"use client";

import type { ReactNode } from "react";

import { Panel, type PanelTag } from "@/components/drishti";
import { cn } from "@/lib/utils";

export type CardProps = {
  title: string;
  description?: ReactNode;
  trailing?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  as?: PanelTag;
  ariaLabel?: string;
  className?: string;
  bodyClassName?: string;
  unframed?: boolean;
};

export function Card({
  title,
  description,
  trailing,
  icon,
  children,
  as = "section",
  ariaLabel,
  className,
  bodyClassName,
  unframed = false,
}: CardProps) {
  const Frame = unframed ? (as as PanelTag) : Panel;
  const frameProps = unframed
    ? { "aria-label": ariaLabel ?? title, className: cn("block", className) }
    : {
        as,
        interactive: false,
        ariaLabel: ariaLabel ?? title,
        className: cn(
          "rounded-lg shadow-xs motion-safe:transition-shadow hover:shadow-sm",
          className,
        ),
      };
  return (
    <Frame {...frameProps}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-start gap-2.5">
          {icon ? (
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-bg-inset text-fg-secondary">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="type-headline text-fg">{title}</h2>
            {description ? (
              <p className="mt-0.5 type-caption text-fg-secondary">{description}</p>
            ) : null}
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </Frame>
  );
}
