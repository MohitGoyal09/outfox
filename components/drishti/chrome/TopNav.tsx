"use client";

import { BarChart3, History, LayoutDashboard, Tag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/cohorts", label: "Cohorts", icon: Users },
  { href: "/runs", label: "Runs", icon: History },
  { href: "/brands", label: "Brands", icon: Tag },
  { href: "/board", label: "Signal board", icon: BarChart3 },
];

export function TopNav({ trailing }: { trailing?: ReactNode }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () => setOverflowing(nav.scrollWidth > nav.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const active = navRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <div className="flex flex-col border-t border-border min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-4">
      <nav
        ref={navRef}
        aria-label="Primary"
        className={cn(
          "flex w-full min-w-0 items-stretch gap-0.5 overflow-x-auto sm:gap-1 min-[900px]:flex-1",
          overflowing &&
            "[mask-image:linear-gradient(to_right,black_calc(100%_-_2rem),transparent)] min-[900px]:[mask-image:none]",
        )}
      >
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
              className={cn(
                "relative flex h-12 shrink-0 items-center gap-2 px-2 text-sm font-medium text-fg-secondary transition-colors duration-150 ease-out hover:text-fg active:translate-y-[0.5px] sm:px-3",
                active && "text-accent hover:text-accent-strong",
              )}
            >
              <Icon aria-hidden className="size-4" strokeWidth={1.5} />
              <span>{item.label}</span>
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-1.5 bottom-0 h-0.5 bg-accent"
                />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {trailing ? (
        <div className="flex shrink-0 items-center justify-end px-0.5 pb-1.5 min-[900px]:h-12 min-[900px]:px-0 min-[900px]:pb-0">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
