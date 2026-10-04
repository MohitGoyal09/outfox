import type { ReactNode } from "react";

import { LazyAppShell } from "@/components/drishti/chrome/LazyAppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <LazyAppShell>{children}</LazyAppShell>;
}
