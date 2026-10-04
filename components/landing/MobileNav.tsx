"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type NavLink = { href: string; label: string };

export function MobileNav({ links }: { links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-10 items-center justify-center rounded-sm border border-border-strong text-fg transition-colors hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
      >
        {open ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 rounded-[14px] bg-bg-raised p-2 ring-0 border border-border-strong">
        <nav aria-label="Sections" className="flex flex-col">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={itemClass}>
              {l.label}
            </a>
          ))}
          
        </nav>
      </PopoverContent>
    </Popover>
  );
}
