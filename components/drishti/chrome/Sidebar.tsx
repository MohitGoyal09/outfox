"use client";

import {
  BarChart3,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Tag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Feed", icon: LayoutDashboard, exact: true },
  { href: "/brands", label: "Brands", icon: Tag },
  { href: "/cohorts", label: "Cohorts", icon: Users },
  { href: "/runs", label: "Runs", icon: ClipboardList },
  { href: "/board", label: "Board", icon: BarChart3 },
  { href: "/ask", label: "Ask Drishti", icon: MessageSquare },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium text-fg-secondary transition-colors duration-150 ease-out hover:bg-bg-raised hover:text-fg focus-visible:bg-bg-raised",
              active && "border-border bg-bg-raised text-accent shadow-[var(--shadow-lift)] hover:text-accent-strong",
            )}
          >
            <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {active ? <ChevronRight aria-hidden className="size-3.5 text-accent" strokeWidth={1.5} /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <div className={cn("flex h-full flex-col", mobile ? "p-4" : "px-3 py-5")}>
      <div className="mb-5 border-b border-border px-2 pb-4">
        <p className="type-label text-accent">Workspace</p>
        <p className="mt-1 text-sm font-medium text-fg">Research desk</p>
        <p className="mt-1 text-xs leading-5 text-fg-secondary">A calm place to track evidence and compare rivals.</p>
      </div>
      <SidebarNav onNavigate={onNavigate} />
      <div className="mt-auto border-t border-border px-2 pt-4">
        <p className="type-label text-fg-tertiary">Evidence Atlas</p>
        <p className="mt-1 text-xs leading-5 text-fg-secondary">Public signals, stored with provenance.</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 border-r border-border bg-bg min-[900px]:block">
        <SidebarContent />
      </aside>

      <div className="mb-5 flex items-center justify-between border-b border-border pb-3 min-[900px]:hidden">
        <div>
          <p className="type-label text-accent">Navigate</p>
          <p className="mt-0.5 text-sm font-medium text-fg">Research desk</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Open primary navigation"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border-strong bg-bg-raised text-fg transition-colors hover:bg-bg-raised-2"
            >
              <Menu aria-hidden className="size-5" strokeWidth={1.5} />
            </button>
          </DialogTrigger>
          <DialogContent
            showCloseButton={false}
            className="left-0 top-0 h-dvh max-w-[min(88vw,22rem)] translate-x-0 translate-y-0 rounded-none rounded-r-xl border-y-0 border-l-0 border-r border-border bg-bg p-0 shadow-[var(--shadow-drawer)] sm:max-w-[22rem]"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Primary navigation</DialogTitle>
              <DialogDescription>Move between Drishti research surfaces.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-end border-b border-border px-4 py-3">
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="Close primary navigation"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border-strong bg-bg-raised text-fg transition-colors hover:bg-bg-raised-2"
                >
                  <X aria-hidden className="size-5" strokeWidth={1.5} />
                </button>
              </DialogClose>
            </div>
            <SidebarContent mobile onNavigate={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
