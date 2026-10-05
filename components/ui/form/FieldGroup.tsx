import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FieldGroup({ legend, actions, className, children }: { legend?: ReactNode; actions?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <fieldset className={cn("m-0 grid min-w-0 gap-x-4 gap-y-3 border-0 p-0 sm:grid-cols-2", className)}>
      {legend ? <legend className="mb-3 p-0 text-[13px] font-medium text-fg-secondary sm:col-span-2">{legend}</legend> : null}
      {children}
      {actions ? <div className="flex flex-wrap items-center justify-end gap-3 sm:col-span-2">{actions}</div> : null}
    </fieldset>
  );
}
