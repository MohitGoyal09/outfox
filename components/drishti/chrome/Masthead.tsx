"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { LogOut, MessageSquare, Plus, Search, UserRound } from "lucide-react";

import { api } from "@/convex/_generated/api";
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
      <div className="flex min-h-[68px] items-center gap-3 sm:gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Drishti home">
          <span className="flex size-8 items-center justify-center rounded-[7px] bg-fg text-sm font-semibold text-bg">D</span>
          <span className="text-[15px] font-semibold tracking-[-0.03em]">Drishti</span>
          {/* Was visible from md (768px). The sidebar's expanded width grew to
              match the Karax port (18rem instead of 15rem), which no longer
              leaves room for this label at 768px without overflowing -- push
              it to lg so the header stays within the viewport there. */}
          <span className="hidden border-l border-border pl-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-tertiary lg:inline-flex">Evidence atlas</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="group flex h-10 min-w-0 max-w-[820px] flex-1 items-center gap-2.5 rounded-[7px] border border-border bg-bg-inset px-3.5 text-left text-sm text-fg-tertiary transition-[border-color,background-color] duration-150 ease-out hover:border-border-strong hover:bg-bg-raised focus-visible:border-accent sm:ml-4" aria-label="Search brands and pages, or ask Drishti">
          <Search aria-hidden className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Search brands and pages, or ask Drishti…</span>
          <kbd className="hidden shrink-0 rounded border border-border-strong bg-bg-raised px-1.5 py-0.5 font-mono text-[10px] text-fg-tertiary sm:inline-flex">⌘K</kbd>
        </button>
        <Button asChild size="sm" className="ml-auto hidden h-9 shrink-0 rounded-[6px] bg-accent px-3.5 text-accent-ink hover:bg-accent-strong sm:inline-flex"><Link href="/onboarding"><Plus aria-hidden /> Add brand</Link></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full text-fg-secondary hover:bg-bg-inset hover:text-fg" aria-label="Account menu"><Avatar size="sm"><AvatarFallback className="border border-border bg-bg-raised text-xs font-semibold text-fg">M</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2"><UserRound className="size-4" /> Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={isSigningOut} onSelect={() => void handleSignOut()}><LogOut className="size-4" /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
              {NAV.map((item) => { const Icon = item.icon; return <CommandItem key={item.href} onSelect={() => { setOpen(false); router.push(item.href); }}><Icon /><span>{item.label}</span></CommandItem>; })}
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
                    <MessageSquare />
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
