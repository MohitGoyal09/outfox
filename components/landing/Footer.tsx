import Link from "next/link";
import { DrishtiMark } from "@/components/drishti/chrome/DrishtiMark";

const linkClass = "rounded-sm text-sm text-fg-secondary transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-raised">
      <div className="l-wrap grid gap-10 py-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2">
            
            <span className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-fg">Drishti</span>
          </div>
          <p className="mt-3 text-[0.9375rem] text-fg-secondary">The trail behind every claim.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 lg:col-span-7 lg:justify-end">
          
          <a href="#product" className={linkClass}>Product</a>
          <a href="#faq" className={linkClass}>FAQ</a>
          <Link href="/signin" className={linkClass}>Sign in</Link>
        </nav>
        <div className="flex flex-col gap-2 border-t border-border pt-6 text-[13px] text-fg-tertiary lg:col-span-12 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-[70ch]">
            Evidence from public sources: Google Search, Google Ads Transparency, YouTube, Google News and Google Trends.
          </p>
          
        </div>
      </div>
    </footer>
  );
}
