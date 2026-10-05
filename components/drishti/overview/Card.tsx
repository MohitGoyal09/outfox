"use client";

import type { ReactNode } from "react";

import { SectionHeader } from "@/components/drishti";
import { cn } from "@/lib/utils";

export type CardProps = {
  title: string;
  description?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
  lead?: boolean;
};

export function Card({ title, description, trailing, children, ariaLabel, className, lead = false }: CardProps) {
  return (
    <section aria-label={ariaLabel ?? title} className={cn(!lead && "border-t border-border pt-6", className)}>
      <SectionHeader title={title} sub={description} trailing={trailing} />
      <div className="mt-4">{children}</div>
    </section>
  );
}
