import Link from "next/link";
import { DrishtiMark } from "@/components/drishti/chrome/DrishtiMark";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./MobileNav";
import { RequestAccessDialog } from "./RequestAccessDialog";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#product", label: "Product" },
  { href: "#limits", label: "What we will not claim" },
  { href: "#faq", label: "FAQ" },
];

const linkClass =
  "rounded-sm px-2 py-1.5 text-sm text-fg-secondary transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
      <div className="l-wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Drishti home">
          
          <span className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-fg">Drishti</span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={linkClass}>
              {l.label}
            </a>
          ))}
        </nav>
        
      </div>
    </header>
  );
}
