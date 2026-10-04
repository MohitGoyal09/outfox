import Link from "next/link";
import { DrishtiMark } from "@/components/drishti/chrome/DrishtiMark";
import { SOURCES } from "./landing-data";
const headClass = "text-[13px] font-medium text-fg";

export function Footer() {
  return (
    <footer className="l-ink relative overflow-hidden bg-[var(--ink-base)]">
      <div className="l-wrap grid gap-10 pb-10 pt-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2">
            
            <span className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-fg">Drishti</span>
          </div>
          <p className="mt-3 text-[0.9375rem] text-fg-secondary">The trail behind every claim.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
          
          <div>
            <p className={headClass}>Account</p>
            <ul className="mt-4 flex list-none flex-col gap-3 p-0">
              <li><Link href="/signin" className={linkClass}>Sign in</Link></li>
              <li><a href="#request-access" className={linkClass}>Request access</a></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className={headClass}>Public sources</p>
            
          </div>
        </nav>
        <div className="flex flex-col gap-2 border-t border-border pt-6 text-[13px] text-fg-tertiary lg:col-span-12 lg:flex-row lg:items-center lg:justify-between">
          
          <p>&copy; 2026 Drishti.</p>
        </div>
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.2em] select-none whitespace-nowrap text-center font-semibold leading-[0.8] tracking-[-0.05em] text-white/5"
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(120px, 22vw, 300px)" }}
      >
        Drishti
      </p>
    </footer>
  );
}
