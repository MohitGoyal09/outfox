import type { ReactNode } from "react";

import { DockedAsk } from "@/components/drishti/chrome/DockedAsk";
import { Masthead } from "@/components/drishti/chrome/Masthead";
import { StatReadout } from "@/components/drishti/chrome/StatReadout";
import { TopNav } from "@/components/drishti/chrome/TopNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:border focus:border-border-strong focus:bg-bg-raised-2 focus:px-3 focus:py-2 focus:text-sm focus:text-fg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-bg">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col px-4 sm:px-6">
          <Masthead />
          <TopNav trailing={<StatReadout />} />
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-32 pt-6 sm:px-6"
      >
        {children}
      </main>

      <DockedAsk />
    </div>
  );
}
