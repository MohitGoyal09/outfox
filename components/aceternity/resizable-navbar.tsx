"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_OUT, useReducedMotion } from "./motion-utils";

const SCROLL_THRESHOLD = 48;

type Visible = { visible?: boolean };

export function Navbar({ children, className }: { children: ReactNode; className?: string }) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setVisible(y > SCROLL_THRESHOLD));

  return (
    <header
      data-shrunk={visible ? "true" : "false"}
      className={cn(
        "pointer-events-none sticky top-0 z-40 h-16 border-b transition-[background-color,border-color] duration-200 ease-out",
        visible ? "border-transparent bg-transparent" : "border-border bg-bg",
        className,
      )}
    >
      {Children.map(children, (child) => (isValidElement(child) ? cloneElement(child as ReactElement<Visible>, { visible }) : child))}
    </header>
  );
}

export function NavBody({ children, className, visible }: { children: ReactNode; className?: string } & Visible) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={{ maxWidth: visible ? 960 : 1200, y: visible ? 8 : 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
      className={cn(
        "pointer-events-auto mx-auto flex h-16 items-center justify-between gap-3 transition-[padding,background-color,border-color,box-shadow,height,border-radius,width] duration-200 ease-out",
        visible
          ? "h-14 w-[calc(100%-1rem)] rounded-full border border-border-strong bg-bg-raised px-4 shadow-md"
          : "w-full border border-transparent bg-transparent px-[clamp(1.25rem,0.5rem+3vw,2.5rem)]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function NavItems({ items, className }: { items: readonly { name: string; link: string }[]; className?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();
  return (
    <div onMouseLeave={() => setActive(null)} className={cn("hidden items-center gap-0.5 lg:flex", className)}>
      {items.map((item, i) => (
        <a
          key={item.link}
          href={item.link}
          onMouseEnter={() => setActive(i)}
          onFocus={() => setActive(i)}
          onBlur={() => setActive(null)}
          className="relative inline-flex min-h-11 items-center rounded-full px-3 text-sm text-fg-secondary transition-colors duration-150 hover:text-fg focus-visible:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {active === i ? (
            <motion.span
              layoutId="navbar-hover"
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-bg-inset"
              transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
            />
          ) : null}
          <span className="relative">{item.name}</span>
        </a>
      ))}
    </div>
  );
}

export const mobileItemClass =
  "flex min-h-11 items-center rounded-sm px-3 text-[0.9375rem] text-fg-secondary transition-colors hover:bg-bg-inset hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function MobileMenu({ children, label = "Sections" }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative lg:hidden"
      onBlur={(e) => {
        if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="landing-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-11 items-center justify-center rounded-sm border border-border-strong text-fg transition-colors hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {open ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.nav
            ref={panelRef}
            id="landing-mobile-menu"
            aria-label={label}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="absolute right-0 top-full mt-3 flex w-64 flex-col rounded-[14px] border border-border-strong bg-bg-raised p-2 shadow-lg"
          >
            {children}
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
