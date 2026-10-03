"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { MoreHorizontal } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sourceName } from "@/components/drishti/labels";
import { RelativeTime } from "../RelativeTime";
import { Panel } from "../Panel";
import { BrandMark } from "./BrandMark";
import { PlatformLogo } from "./PlatformLogo";
import { FETCH_ENGINES, type BrandDoc, type FetchEngine } from "./brand-model";

const STATUS_WORDS: Record<string, string> = {
  ready: "Ready",
  pending: "Pending",
  needs_confirmation: "Needs confirmation",
};

function StatusBadge({ status }: { status: string }) {
  const ready = status === "ready";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium",
        ready ? "border-ok/30 bg-ok/10 text-ok" : "border-warn/30 bg-warn/10 text-warn",
      )}
    >
      {STATUS_WORDS[status] ?? "Unknown"}
    </span>
  );
}

function SourceMarks({ engines }: { engines: Set<FetchEngine> }) {
  return (
    <ul className="relative z-10 flex items-center gap-1.5" aria-label="Evidence sources">
      {FETCH_ENGINES.map((engine) => {
        const on = engines.has(engine);
        const text = `${sourceName(engine)}: ${on ? "has evidence" : "no evidence yet"}`;
        return (
          <li key={engine}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  aria-label={text}
                  className="flex size-4 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <PlatformLogo
                    engine={engine}
                    className={cn("size-3.5", !on && "opacity-30 grayscale")}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>{text}</TooltipContent>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}

function RowMenu({ brand, own }: { brand: BrandDoc; own: boolean }) {
  const setOwnBrand = useMutation(api.brands.setOwnBrand);
  const clearOwnBrand = useMutation(api.brands.clearOwnBrand);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    try {
      if (own) await clearOwnBrand({});
      else await setOwnBrand({ brandId: brand._id });
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative z-10 size-8"
          aria-label={`More actions for ${brand.name}`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={pending} onSelect={() => void toggle()}>
          {own ? "Not my brand" : "Set as my brand"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type BrandRowProps = {
  brand: BrandDoc;
  own?: boolean;
  claimCount: number | undefined;
  latestCheckAt: string | undefined;
  engines: Set<FetchEngine>;
};

export function BrandRow({ brand, own = false, claimCount, latestCheckAt, engines }: BrandRowProps) {
  return (
    <Panel
      interactive
      padded={false}
      className={cn("group relative", own && "border-accent/35 bg-accent/[0.03]")}
      ariaLabel={brand.name}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 md:min-h-16 md:grid-cols-[minmax(0,1fr)_88px_auto_104px_88px_96px_32px] md:py-2">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark name={brand.name} domain={brand.domain} className="size-10 rounded-xl" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-fg">
                <Link
                  href={`/brands/${brand._id}`}
                  className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                >
                  {brand.name}
                </Link>
              </h3>
              {own ? (
                <span className="shrink-0 rounded-full bg-fg px-2 py-0.5 text-[10px] font-medium text-bg-raised">
                  Your brand
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {brand.domain} · {brand.vertical}
            </p>
          </div>
        </div>
        <div className="flex justify-end md:order-last">
          <RowMenu brand={brand} own={own} />
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 md:contents">
          <span className="text-xs text-muted-foreground">
            <span className="font-mono text-sm font-medium tabular-nums text-fg">{claimCount ?? "-"}</span>{" "}
            evidence
          </span>
          <SourceMarks engines={engines} />
          <span className="text-xs text-muted-foreground">
            Latest check{" "}
            {latestCheckAt ? (
              <RelativeTime iso={latestCheckAt} className="relative z-10 font-mono tabular-nums text-fg" />
            ) : (
              <span className="text-fg">none yet</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            Added{" "}
            {brand.createdAt ? (
              <RelativeTime iso={brand.createdAt} className="relative z-10 font-mono tabular-nums text-fg" />
            ) : (
              "-"
            )}
          </span>
          <span className="md:justify-self-start">
            <StatusBadge status={brand.profileStatus} />
          </span>
        </div>
      </div>
    </Panel>
  );
}
