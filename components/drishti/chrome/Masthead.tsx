"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { LogOut, MessageSquare, Plus, Search, UserRound } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { CreditsChip } from "@/components/drishti/chrome/CreditsChip";
import { NAV } from "@/components/drishti/chrome/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { iconProps } from "@/components/drishti";

export function Masthead() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const brands = useQuery(api.brands.listBrands) ?? [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  function navigateToAsk(question: string) {
    const trimmed = question.trim();
    setOpen(false);
    setQuery("");
    if (trimmed === "") {
      router.push("/ask");
      return;
    }
    const chatId = `chat-${crypto.randomUUID()}`;
    router.push(`/ask?${new URLSearchParams({ chat: chatId, q: trimmed }).toString()}`);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    try { await signOut(); } finally { setIsSigningOut(false); }
  }

  return (
    <>
      <div className="flex h-full min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex h-9 w-full min-w-0 max-w-[520px] items-center gap-2.5 rounded-sm border border-border bg-bg-raised px-3 text-left text-sm text-fg-tertiary shadow-xs transition-[border-color,background-color,box-shadow] duration-150 ease-out hover:border-border-strong hover:bg-bg-raised hover:shadow-sm sm:h-10"
          aria-label="Search brands and pages, or ask Drishti"
        >
          <Search {...iconProps} aria-hidden className="size-4 shrink-0 text-fg-secondary" />
          <span className="min-w-0 flex-1 truncate">Search brands and pages, or ask Drishti…</span>
          <kbd className="hidden shrink-0 rounded-sm border border-border bg-bg-inset px-1.5 py-0.5 font-mono text-[10px] text-fg-tertiary sm:inline-flex">
            ⌘K
          </kbd>
        </button>
        {/* Actions live in the top-right corner, not floating after the search:
            a spacer pins this cluster to the edge at every width. */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Ambient, always visible: the account's hardest operating
              constraint (PRODUCT.md's 250-searches/month plan) is in view
              right where someone is about to spend one. */}
          <CreditsChip />
          <Button
            asChild
            size="sm"
            className="hidden h-9 shrink-0 rounded-sm bg-accent px-3.5 text-accent-ink hover:bg-accent-strong sm:inline-flex"
          >
            <Link href="/brands?add=1">
              <Plus {...iconProps} aria-hidden className="size-4" />
              Add brand
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full text-fg-secondary hover:bg-bg-inset hover:text-fg"
                aria-label="Account menu"
              >
                <Avatar size="sm">
                  <AvatarFallback className="border border-border bg-bg-raised text-xs font-semibold text-fg">
                    M
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2"><UserRound {...iconProps} className="size-4" /> Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={isSigningOut} onSelect={() => void handleSignOut()}><LogOut {...iconProps} className="size-4" /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        title="Search Drishti"
        description="Jump to a tracked brand or a page, or ask Drishti a question."
      >
        <Command
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              navigateToAsk(query);
            }
          }}
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search brands and pages, or ask Drishti…"
          />
          <CommandList>
            <CommandEmpty>No matching brand or page.</CommandEmpty>
            <CommandGroup heading="Navigate">
              {NAV.map((item) => { const Icon = item.icon; return <CommandItem key={item.href} onSelect={() => { setOpen(false); router.push(item.href); }}><Icon {...iconProps} className="size-4" /><span>{item.label}</span></CommandItem>; })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Tracked brands">
              {brands.slice(0, 8).map((brand) => <CommandItem key={brand._id} value={`${brand.name} ${brand.domain}`} onSelect={() => { setOpen(false); router.push(`/brands/${brand._id}`); }}><span className="flex size-5 items-center justify-center rounded bg-accent-dim text-[10px] font-semibold text-accent">{brand.name.slice(0, 1).toUpperCase()}</span><span>{brand.name}</span></CommandItem>)}
            </CommandGroup>
            {query.trim() !== "" ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Ask Drishti">
                  {/* `value` is the typed query itself, so this item always
                      matches cmdk's own filter no matter what was typed --
                      it is the fallback that replaces the former dead-end
                      "No matching research surface" state. */}
                  <CommandItem value={query} onSelect={() => navigateToAsk(query)}>
                    <MessageSquare {...iconProps} className="size-4" />
                    <span className="truncate">Ask Drishti: &ldquo;{query.trim()}&rdquo;</span>
                    <CommandShortcut>⌘↵</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
