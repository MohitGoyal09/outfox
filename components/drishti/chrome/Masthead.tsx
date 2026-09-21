"use client";

import { LogOut, Plus, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function Masthead() {
  const { signOut } = useAuthActions();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-14 items-center gap-3 sm:gap-4">
      <Link
        href="/"
        className="type-title shrink-0 text-fg transition-colors duration-150 ease-out hover:text-accent-strong"
      >
        Drishti
      </Link>

      <form
        role="search"
        action="/ask"
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
          placeholder="Search brands, claims, or ask…"
          className="h-9 w-full rounded-sm border border-border-strong bg-bg-inset pl-9 pr-3 text-base text-fg outline-none transition-colors duration-150 ease-out hover:border-fg-tertiary focus:border-accent aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-bg-raised disabled:text-fg-tertiary [&::-webkit-search-cancel-button]:appearance-none"
        />
      </form>

      <Link
        href="/brands#brand-form"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm bg-accent px-3 text-sm font-medium text-accent-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors duration-150 ease-out hover:bg-accent-strong active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:bg-bg-raised disabled:text-fg-tertiary disabled:shadow-none"
      >
        <Plus aria-hidden className="size-4" strokeWidth={1.5} />
        Add brand
      </Link>

      <div className="ml-auto flex items-center gap-1 border-l border-border pl-2">
        <span className="hidden items-center gap-1.5 px-2 text-xs text-fg-secondary sm:inline-flex">
          <UserRound aria-hidden className="size-3.5" strokeWidth={1.5} />
          Account
        </span>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
          aria-label="Sign out"
          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-sm border border-border-strong bg-bg-raised text-fg-secondary transition-colors hover:bg-bg-raised-2 hover:text-fg disabled:cursor-not-allowed disabled:text-fg-tertiary"
        >
          <LogOut aria-hidden className="size-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
