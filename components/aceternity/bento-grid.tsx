import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}

export function BentoGridItem({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      aria-labelledby={id}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-border bg-bg-raised shadow-xs transition-[box-shadow,border-color] duration-150 hover:border-border-strong hover:shadow-md",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col bg-bg-raised-2 p-4 sm:p-5">{children}</div>
      <div className="border-t border-border px-5 py-4">
        <h3 id={id} className="l-h3 text-fg">
          {title}
        </h3>
        <p className="mt-1.5 text-[0.9375rem] leading-[1.5] text-fg-secondary">{description}</p>
      </div>
    </article>
  );
}
