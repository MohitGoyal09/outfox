"use client";

import Link from "next/link";
import { DrishtiMark } from "@/components/drishti/chrome/DrishtiMark";
import { Button } from "@/components/ui/button";
import { MovingBorder } from "@/components/aceternity/moving-border";
import { MobileMenu, NavBody, NavItems, Navbar, mobileItemClass } from "@/components/aceternity/resizable-navbar";
import { RequestAccessDialog } from "./RequestAccessDialog";

const LINKS = [
  { link: "#how-it-works", name: "How it works" },
  { link: "#product", name: "Product" },
  { link: "#limits", name: "What we will not claim" },
  { link: "#faq", name: "FAQ" },
] as const;

export function LandingNav() {
  return (
    <Navbar>
      <NavBody>
        
        
        <div className="flex items-center gap-2">
          <Link href="/signin" className={`hidden min-h-11 items-center rounded-sm px-3 text-sm text-fg-secondary transition-colors duration-150 hover:text-fg sm:inline-flex ${focusRing}`}>
            Sign in
          </Link>
          <MovingBorder radius={9}>
            <RequestAccessDialog>
              <Button size="lg" className="h-11 rounded-[8px] px-3.5">Request access</Button>
            </RequestAccessDialog>
          </MovingBorder>
          <MobileMenu>
            {LINKS.map((l) => (
              <a key={l.link} href={l.link} className={mobileItemClass}>
                {l.name}
              </a>
            ))}
            <Link href="/signin" className={`${mobileItemClass} mt-1 border-t border-border sm:hidden`}>
              Sign in
            </Link>
          </MobileMenu>
        </div>
      </NavBody>
    </Navbar>
  );
}
