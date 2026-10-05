import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  variant?: "page" | "entity";
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
  meta,
  variant = "page",
  className,
}: PageHeaderProps) {
  const entity = variant === "entity";
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-6", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="mb-2 font-mono text-xs font-medium uppercase leading-none tracking-[0.04em] text-fg-secondary">
            {eyebrow}
          </div>
        ) : null}
        <h1 className={cn("type-page", entity && "truncate")}>{title}</h1>
        {sub && !entity ? <p className="mt-2 max-w-[62ch] text-sm text-fg-secondary">{sub}</p> : null}
        {entity && (meta || sub) ? (
          <p className="mt-2 text-sm text-fg-tertiary">{meta ?? sub}</p>
        ) : null}
        {!entity && meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
