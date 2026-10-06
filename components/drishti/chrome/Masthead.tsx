"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { LogOut, MessageSquare, Plus, Search, UserRound } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { useAddBrandHref } from "@/components/drishti/brands/useAddBrandHref";
import { CreditsChip } from "@/components/drishti/chrome/CreditsChip";
import { NAV } from "@/components/drishti/chrome/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { pillClasses } from "@/components/drishti/PillButton";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
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
import { cn } from "@/lib/utils";

const subscribeNever = () => () => {};
function readModKey(): "⌘" | "Ctrl" {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad/i.test(platform) ? "⌘" : "Ctrl";
}

export function Masthead() {
  const router = useRouter();
  const addBrandHref = useAddBrandHref();
  const { signOut } = useAuthActions();
  const brands = useQuery(api.brands.listBrands) ?? [];
  const me = useQuery(api.users.me);
  const displayName = me?.name?.trim() || null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const mod = useSyncExternalStore(subscribeNever, readModKey, () => null);

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
          className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-bg-raised text-fg-secondary transition-[border-color,box-shadow] duration-150 ease-out hover:border-fg/40 focus-visible:border-fg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent-dim sm:hidden"
          aria-label="Search"
        >
          <Search {...iconProps} aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group hidden h-10 w-full min-w-0 max-w-[520px] items-center gap-2.5 rounded-sm border border-border-strong bg-bg-raised px-3 text-left text-sm text-fg-tertiary transition-[border-color,box-shadow] duration-150 ease-out hover:border-fg/40 focus-visible:border-fg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent-dim sm:flex"
          aria-label="Search brands and pages, or ask Outfox"
        >
          <Search {...iconProps} aria-hidden className="size-4 shrink-0 text-fg-secondary" />
          <span className="min-w-0 flex-1 truncate">Search brands and pages, or ask Outfox…</span>
          {mod ? (
            <KbdGroup className="ml-auto shrink-0">
              <Kbd>{mod}</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          ) : null}
        </button>
        {/* Actions live in the top-right corner, not floating after the search:
            a spacer pins this cluster to the edge at every width. */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Ambient, always visible: the account's hardest operating
              constraint (PRODUCT.md's 250-searches/month plan) is in view
              right where someone is about to spend one. */}
          <CreditsChip />
          <Link
            href={addBrandHref}
            scroll={false}
            className={cn(pillClasses("ink", "sm"), "hidden shrink-0 sm:inline-flex")}
          >
            <Plus {...iconProps} aria-hidden className="size-4" />
            Add brand
          </Link>
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
                    {displayName ? displayName.charAt(0).toUpperCase() : <UserRound {...iconProps} className="size-3.5" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2"><UserRound {...iconProps} className="size-4" /> <span className="truncate">{displayName ?? "Account"}</span></DropdownMenuLabel>
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
        title="Search Outfox"
        description="Jump to a tracked brand or a page, or ask Outfox a question."
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
            placeholder="Search brands and pages, or ask Outfox…"
          />
          <CommandList>
            <CommandEmpty>No matching brand or page.</CommandEmpty>
            <CommandGroup heading="Navigate">
              {NAV.map((item) => { const Icon = item.icon; return <CommandItem key={item.href} onSelect={() => { setOpen(false); router.push(item.href); }}><Icon {...iconProps} className="size-4" /><span>{item.label}</span></CommandItem>; })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Tracked brands">
              {brands.slice(0, 8).map((brand) => <CommandItem key={brand._id} value={`${brand.name} ${brand.domain}`} onSelect={() => { setOpen(false); router.push(`/brands/${brand._id}`); }}><span className="flex size-5 items-center justify-center rounded bg-bg-inset text-[10px] font-semibold text-fg">{brand.name.slice(0, 1).toUpperCase()}</span><span>{brand.name}</span></CommandItem>)}
            </CommandGroup>
            {query.trim() !== "" ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Ask Outfox">
                  {/* `value` is the typed query itself, so this item always
                      matches cmdk's own filter no matter what was typed --
                      it is the fallback that replaces the former dead-end
                      "No matching research surface" state. */}
                  <CommandItem value={query} onSelect={() => navigateToAsk(query)}>
                    <MessageSquare {...iconProps} className="size-4" />
                    <span className="truncate">Ask Outfox: &ldquo;{query.trim()}&rdquo;</span>
                    {mod ? <CommandShortcut>{mod === "⌘" ? "⌘↵" : "Ctrl ↵"}</CommandShortcut> : null}
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
