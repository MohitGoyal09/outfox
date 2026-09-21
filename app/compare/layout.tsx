import type { ReactNode } from "react";
import { AppShell } from "@/components/drishti/chrome/AppShell";

export default function CompareLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
