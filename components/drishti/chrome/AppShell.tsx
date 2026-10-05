import type { ReactNode } from "react";

import { Masthead } from "@/components/drishti/chrome/Masthead";
import { Sidebar } from "@/components/drishti/chrome/Sidebar";
import { AddBrandDialog } from "@/components/drishti/brands/AddBrandDialog";
import { ContextualAsk } from "@/components/drishti/chrome/ContextualAsk";
import { SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="min-h-dvh w-full bg-bg-raised-2">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-bg-raised focus:px-3 focus:py-2 focus:text-sm focus:text-fg focus:shadow-[var(--shadow-toast)]"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-h-svh w-full min-w-0 flex-1 flex-col">
        {/* The header is a fixed 64px bar, level with the sidebar's own header,
            so the rail and the top bar share one horizontal rule. */}
        <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
          <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0 flex-1">
              <Masthead />
            </div>
          </div>
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-[1440px] min-w-0 px-4 pb-32 pt-8 sm:px-6 sm:pt-10 lg:px-8"
        >
          {children}
        </main>
      </div>
      <ContextualAsk />
      <AddBrandDialog />
    </SidebarProvider>
  );
}
