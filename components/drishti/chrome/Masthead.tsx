import { Plus, Search } from "lucide-react";
import Link from "next/link";

export function Masthead() {
  return (
    <div className="flex h-14 items-center gap-3 sm:gap-4">
      <Link
        href="/"
        className="type-title shrink-0 text-fg transition-colors duration-150 ease-out hover:text-accent-strong"
      >
        Drishti
      </Link>

      <form
        role="search"
        action="/search"
        method="get"
        className="relative min-w-0 max-w-xl flex-1"
      >
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-tertiary"
          strokeWidth={1.5}
        />
        <label htmlFor="global-search" className="sr-only">
          Search rivals, brands, or claims
        </label>
        <input
          id="global-search"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Search rivals, brands, or claims…"
          className="h-9 w-full rounded-sm border border-border-strong bg-bg-inset pl-9 pr-3 text-base text-fg outline-none transition-colors duration-150 ease-out hover:border-fg-tertiary focus:border-accent aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-bg-raised disabled:text-fg-tertiary [&::-webkit-search-cancel-button]:appearance-none"
        />
      </form>

      <Link
        href="/cohorts"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm bg-accent px-3 text-sm font-medium text-accent-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors duration-150 ease-out hover:bg-accent-strong active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:bg-bg-raised disabled:text-fg-tertiary disabled:shadow-none"
      >
        <Plus aria-hidden className="size-4" strokeWidth={1.5} />
        Add cohort
      </Link>
    </div>
  );
}
