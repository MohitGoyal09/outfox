import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  title: ReactNode;
  sub?: ReactNode;
  trailing?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
};

export function SectionHeader({ title, sub, trailing, as: Tag = "h2", className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <Tag className="type-headline text-fg">{title}</Tag>
        {sub ? <p className="mt-0.5 type-caption text-fg-secondary">{sub}</p> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
