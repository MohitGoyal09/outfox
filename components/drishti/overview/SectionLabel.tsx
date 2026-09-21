import type { ReactNode } from "react";

import { LABEL_CLASS } from "@/components/drishti";
import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  trailing,
  className,
}: {
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <h2 className={cn(LABEL_CLASS, "shrink-0 text-fg-tertiary")}>{children}</h2>
      <span aria-hidden="true" className="h-px min-w-0 flex-1 bg-border" />
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </div>
  );
}
