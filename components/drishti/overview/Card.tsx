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
  children,
  as = "section",
  ariaLabel,
  className,
  bodyClassName,
  unframed = false,
}: CardProps) {
  const inner = (
    <>
      <Panel.Header title={title} description={description} trailing={trailing} />
      <Panel.Body className={bodyClassName}>{children}</Panel.Body>
    </>
  );
  if (unframed) {
    const Frame = as;
    return (
      <Frame aria-label={ariaLabel ?? title} className={cn("block", className)}>
        {inner}
      </Frame>
    );
  }
  return (
    <Panel as={as} ariaLabel={ariaLabel ?? title} className={className}>
      {inner}
    </Panel>
  );
}
