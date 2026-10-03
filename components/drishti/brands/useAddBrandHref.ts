"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { addBrandHref } from "./add-brand-model";

export function useAddBrandHref(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return addBrandHref(pathname, new URLSearchParams(searchParams.toString()));
}
