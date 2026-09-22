import type { ReactNode } from "react";

import { Masthead } from "@/components/drishti/chrome/Masthead";
import { Sidebar } from "@/components/drishti/chrome/Sidebar";
import { ContextualAsk } from "@/components/drishti/chrome/ContextualAsk";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="min-h-dvh w-full bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-bg-raised focus:px-3 focus:py-2 focus:text-sm focus:text-fg focus:shadow-[var(--shadow-toast)]"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-h-svh w-full min-w-0 flex-1 flex-col bg-bg">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
          <div className="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-5 sm:px-7 lg:px-8">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <Masthead />
            </div>
          </div>
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-[1440px] min-w-0 px-5 pb-28 pt-8 sm:px-7 lg:px-8 lg:pt-10"
        >
          {children}
        </main>
      </div>
      <ContextualAsk />
    </SidebarProvider>
  );
}
