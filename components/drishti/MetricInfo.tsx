"use client";

import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FOCUS_RING_CLASS, iconProps } from "./tokens";

export function MetricInfo({
  label,
  definition,
  children,
  className,
}: {
  label: string;
  definition?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const body = definition ?? children;

  if (body === undefined || body === null) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `MetricInfo("${label}") was rendered with no definition. Pass \`definition\` or \`children\`.`,
      );
    }
    return <span className={className}>{label}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span>{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`What does ${label} mean?`}
            className={cn(
              "inline-grid size-4 shrink-0 place-items-center rounded-full text-fg-tertiary transition-colors hover:text-fg",
              FOCUS_RING_CLASS,
            )}
          >
            <HelpCircle {...iconProps} size={14} aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={6}
          className="w-64 space-y-1 p-3"
        >
          <p className="text-xs font-semibold text-fg">{label}</p>
          <p className="text-[11px] leading-5 text-muted-foreground">{body}</p>
        </PopoverContent>
      </Popover>
    </span>
  );
}
