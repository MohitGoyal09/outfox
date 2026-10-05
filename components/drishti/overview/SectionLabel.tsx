import type { ReactNode } from "react";

import { SectionHeader } from "@/components/drishti";

export function SectionLabel({
  children,
  trailing,
  className,
}: {
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return <SectionHeader title={children} trailing={trailing} className={className} />;
}
