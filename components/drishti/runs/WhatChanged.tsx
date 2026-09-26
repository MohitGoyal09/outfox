"use client";

import { Fragment, type ReactNode } from "react";

import {
  LABEL_CLASS,
  Panel,
  Skeleton,
  SkeletonRegion,
  VALUE_CLASS,
} from "@/components/drishti";
import { cn } from "@/lib/utils";
import { READOUT_SEPARATOR } from "./labels";
import type { ChangeCopy } from "./types";

export type WhatChangedProps = {
  copy?: ChangeCopy;
  action?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function WhatChanged({ copy, action, loading = false, className }: WhatChangedProps) {
  const resolved = copy ?? null;
  return (
    <Panel interactive={false} className={cn("p-6", className)} ariaLabel="What changed">
      <h2 className={cn(LABEL_CLASS, "text-[var(--text-tertiary)]")}>
        What changed
      </h2>

      {loading || resolved === null ? (
        <SkeletonRegion label="Working out what changed" className="mt-3">
          <div className="flex flex-col gap-3">
            <Skeleton variant="text" width="46%" height={20} />
            <Skeleton variant="text" lines={2} height={12} />
            <Skeleton variant="text" width="34%" height={11} />
          </div>
        </SkeletonRegion>
      ) : (
        <>
          <p className="mt-2 max-w-[48ch] text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {resolved.headline}
          </p>
          <p className="type-body measure-prose mt-3 text-[var(--text-secondary)]">
            {resolved.body}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {resolved.facts.map((fact, index) => (
                <Fragment key={fact}>
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-[var(--text-tertiary)]">
                      {READOUT_SEPARATOR}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      VALUE_CLASS,
                      "text-[12px] text-[var(--text-secondary)]",
                    )}
                  >
                    {fact}
                  </span>
                </Fragment>
              ))}
            </p>
            {action}
          </div>
        </>
      )}
    </Panel>
  );
}
