"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import {
  BarChart3,
  Building2,
  BookOpen,
  Bookmark,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { categoricalColorFor } from "@/components/drishti/tokens";


const NAV = [
  { href: "/brands", label: "Brands", icon: Building2 },
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

const GROUP_LABEL_CLASS =
  "px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden";

const RAIL_ICON_BUTTON_CLASS =
  "rounded-md p-1 text-sidebar-foreground/55 transition-colors duration-150 ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeThreadKey =
    pathname === "/ask" ? searchParams.get("chat") ?? searchParams.get("cohort") ?? "" : null;
  const brands = useQuery(api.brands.listBrands) ?? [];
  const threads = useQuery(api.messages.listThreads, {});
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarPrimitive collapsible="icon" className="border-sidebar-border">
      {/* Fixed 64px (h-16) header, matching the app's top bar. The collapse
          control lives HERE, on the rail itself (karaxai pattern): expanded it
          is a chevron beside the wordmark; collapsed the logo becomes the
          "open" toggle. The top bar carries no sidebar control. */}
      <SidebarHeader className="h-16 flex-row items-center gap-2 border-b border-sidebar-border px-3 py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Open sidebar"
                className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <PanelLeftOpen aria-hidden className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Open sidebar</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Link
              href="/"
              className="flex h-full min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-md transition-opacity duration-150 ease-out hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              aria-label="Drishti home"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                D
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">Drishti</span>
                <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/55">
                  Evidence atlas
                </span>
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label="Collapse sidebar"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/55 transition-colors duration-150 ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <PanelLeftClose aria-hidden className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Collapse sidebar</TooltipContent>
            </Tooltip>
          </>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className={GROUP_LABEL_CLASS}>Research desk</SidebarGroupLabel>
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
                        "h-11 rounded-full text-sidebar-foreground/75 transition-colors duration-200 ease-out hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:h-10",
                        active &&
                          "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-xs ring-1 ring-sidebar-border",
                      )}
                    >
                      <Link href={item.href} aria-current={active ? "page" : undefined}>
                        <Icon
                          aria-hidden
                          className={cn(
                            "transition-transform duration-200 ease-out",
                            active && "scale-110",
                          )}
                        />
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
            <SidebarGroupLabel className={cn(GROUP_LABEL_CLASS, "p-0")}>Recent chats</SidebarGroupLabel>
            {/* /ask with no query params is already a clean slate: fresh thread
                key, empty history. Same treatment as the Tracked brands "+" so
                the two read as one pattern. */}
            <Link href="/ask" className={RAIL_ICON_BUTTON_CLASS} aria-label="New chat">
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
                      className="rounded-full text-sidebar-foreground/65 transition-colors duration-200 ease-out hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
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
            <SidebarGroupLabel className={cn(GROUP_LABEL_CLASS, "p-0")}>
              Tracked brands
            </SidebarGroupLabel>
            {/* `?add=1` opens the add-rival form on the brands page. A search
                param, not a `#hash`: the router publishes it, so the page hears
                the click even when it is already on /brands. */}
            <Link href="/brands?add=1" className={RAIL_ICON_BUTTON_CLASS} aria-label="Add a brand">
              <Plus aria-hidden className="size-3.5" />
            </Link>
          </div>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {brands.slice(0, 5).map((brand) => (
                <SidebarMenuItem key={brand._id}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    className="rounded-full text-sidebar-foreground/65 transition-colors duration-200 ease-out hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                  >
                    <Link href={`/brands/${brand._id}`}>
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white"
                        style={{ backgroundColor: categoricalColorFor(brand.name) }}
                      >
                        {brand.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>{brand.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {brands.length === 0 ? (
                <li className="px-2 py-2 text-xs leading-5 text-sidebar-foreground/45">
                  Add a brand to start building your evidence desk.
                </li>
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
          <p className="mt-1 text-[11px] leading-4 text-sidebar-foreground/55">
            Public signals, each one linked back to where it came from.
          </p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Add a brand"
              className="rounded-full text-sidebar-foreground/75 transition-colors duration-200 ease-out hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            >
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
