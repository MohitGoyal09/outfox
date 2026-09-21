"use client";

import { usePathname } from "next/navigation";
import { DockedAsk } from "@/components/drishti/chrome/DockedAsk";

export function ContextualAsk() {
  const pathname = usePathname();
  const visible = pathname.startsWith("/brands/");
  return visible ? <DockedAsk /> : null;
}
