"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import {
  BarChart3,
  BookOpen,
  Bookmark,
  MessageSquare,
  Plus,
  Tag,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const LIGHT_SIDEBAR_VARS = {
  "--sidebar": "var(--bg-raised)",
  "--sidebar-foreground": "var(--text-primary)",
  "--sidebar-primary": "var(--text-primary)",
  "--sidebar-primary-foreground": "var(--bg-raised)",
  "--sidebar-accent": "var(--bg-inset)",
  "--sidebar-accent-foreground": "var(--text-primary)",
  "--sidebar-border": "var(--border)",
  "--sidebar-ring": "var(--text-primary)",
} as CSSProperties;

const NAV = [
  { href: "/brands", label: "Brands", icon: Tag },
  { href: "/signals", label: "Signals", icon: BarChart3 },
  { href: "/boards", label: "Boards", icon: Bookmark },
  { href: "/ask", label: "Ask", icon: MessageSquare },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hrefForThread(threadKey: string): string {
  return threadKey === "" ? "/ask" : `/ask?chat=${encodeURIComponent(threadKey)}`;
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeThreadKey =
    pathname === "/ask" ? searchParams.get("chat") ?? searchParams.get("cohort") ?? "" : null;
  const brands = useQuery(api.brands.listBrands) ?? [];
  const threads = useQuery(api.messages.listThreads, {});

  return (
    <SidebarPrimitive collapsible="icon" className="border-sidebar-border" style={LIGHT_SIDEBAR_VARS}>
      <SidebarHeader className="h-16 flex-row items-center gap-3 px-4 py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <Link href="/" className="flex h-full min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-md transition-colors duration-150 ease-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center" aria-label="Drishti home">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            D
          </span>
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">Drishti</span>
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/55">Evidence atlas</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden">
            Research desk
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      size="lg"
                      className={cn(
                        "h-11 rounded-full text-sidebar-foreground/72 transition-colors duration-200 ease-out hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:h-10",
                        active && "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                    >
                      <Link href={item.href} aria-current={active ? "page" : undefined}>
                        <Icon aria-hidden className={cn("transition-transform duration-200 ease-out", active && "scale-110")} />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 w-auto bg-sidebar-border/70" />

        <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="p-0 font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45">
              Recent chats
            </SidebarGroupLabel>
            {/* /ask with no query params is already a clean slate: fresh thread
                key, empty history. Same treatment as the Tracked brands "+" so
                the two read as one pattern. Neutral only -- this surface
                deliberately carries no accent. */}
            <Link
              href="/ask"
              className="rounded-md p-1 text-sidebar-foreground/50 transition-colors duration-150 ease-out hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="New chat"
            >
              <Plus aria-hidden className="size-3.5" />
            </Link>
          </div>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu>
              {threads === undefined || threads.length === 0 ? (
                <li className="px-2 py-2 text-xs leading-5 text-sidebar-foreground/45">
                  Questions you ask will show up here.
                </li>
              ) : (
                threads.slice(0, 6).map((thread) => (
                  <SidebarMenuItem key={thread.threadKey}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={activeThreadKey === thread.threadKey}
                      tooltip={thread.title}
                      className="rounded-full text-sidebar-foreground/60 transition-colors duration-200 ease-out hover:text-sidebar-foreground"
                    >
                      <Link href={hrefForThread(thread.threadKey)}>
                        <MessageSquare aria-hidden className="size-3.5" />
                        <span className="truncate">{thread.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 w-auto bg-sidebar-border/70" />

        <SidebarGroup className="px-3 py-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="p-0 font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45">Tracked brands</SidebarGroupLabel>
            <Link href="/onboarding" className="rounded-md p-1 text-sidebar-foreground/50 transition-colors duration-150 ease-out hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label="Add brand">
              <Plus aria-hidden className="size-3.5" />
            </Link>
          </div>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {brands.slice(0, 5).map((brand) => (
                <SidebarMenuItem key={brand._id}>
                  <SidebarMenuButton asChild size="sm" className="rounded-full text-sidebar-foreground/60 transition-colors duration-200 ease-out hover:text-sidebar-foreground">
                    <Link href={`/brands/${brand._id}`}>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-[10px] font-semibold text-sidebar-foreground/70">
                        {brand.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>{brand.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {brands.length === 0 ? (
                <li className="px-2 py-2 text-xs leading-5 text-sidebar-foreground/45">Add a brand to start building your evidence desk.</li>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 p-3 group-data-[collapsible=icon]:p-2">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground">
            <BookOpen aria-hidden className="size-3.5 text-sidebar-primary" />
            Your evidence desk
          </div>
          <p className="mt-1 text-[11px] leading-4 text-sidebar-foreground/55">Public signals, each one linked back to where it came from.</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Add a brand" className="rounded-full text-sidebar-foreground/70 transition-colors duration-200 ease-out hover:text-sidebar-foreground">
              <Link href="/brands#brand-form" aria-label="Add a brand">
                <Plus aria-hidden />
                <span className="group-data-[collapsible=icon]:hidden">Add a brand</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}

export { NAV };
