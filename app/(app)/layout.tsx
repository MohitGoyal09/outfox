import type { ReactNode } from "react";

import { DockedAsk } from "@/components/drishti/chrome/DockedAsk";
import { Masthead } from "@/components/drishti/chrome/Masthead";
import { Sidebar } from "@/components/drishti/chrome/Sidebar";
import { StatReadout } from "@/components/drishti/chrome/StatReadout";

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
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <Masthead />
          </div>
          <StatReadout className="hidden shrink-0 sm:block" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] flex-1">
        <Sidebar />
        <main
          id="main"
          className="min-w-0 flex-1 px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-32"
        >
          {children}
        </main>
      </div>

      <DockedAsk />
    </div>
  );
}
