"use client";

import { Fragment, type ReactNode } from "react";

import {
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
    <Panel interactive={false} className={cn("p-5", className)} ariaLabel="What changed">
      <h2 className="type-headline text-[var(--text-secondary,#9797a3)]">
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
          <p className="type-title mt-1 max-w-[42ch] text-balance text-[var(--text-primary,#eeeef2)]">
            {resolved.headline}
          </p>
          <p className="type-body measure-prose mt-3 text-[var(--text-secondary,#9797a3)]">
            {resolved.body}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {resolved.facts.map((fact, index) => (
                <Fragment key={fact}>
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-[var(--text-tertiary,#64646f)]">
                      {READOUT_SEPARATOR}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      VALUE_CLASS,
                      "text-[12px] text-[var(--text-secondary,#9797a3)]",
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
