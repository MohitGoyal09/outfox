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
import { sameSource, sourceName, uniqueSources } from "@/components/drishti/labels";
import { RelativeTime } from "../RelativeTime";
import { Chip } from "../Chip";
import type { DataTableColumn } from "../DataTable";
import { BrandMark } from "./BrandMark";
import { PlatformLogo } from "./PlatformLogo";
import { categoryLabel } from "./add-brand-model";
import { statusLabel } from "./status-labels";
import { FETCH_ENGINES, STALE_CHECK_DAYS, type BrandDoc, type FetchEngine } from "./brand-model";

function StatusChip({ status }: { status: string }) {
  return (
    <Chip variant="status" tone={status === "ready" ? "ok" : "warn"}>
      {statusLabel(status)}
    </Chip>
  );
}

function SourceMarks({ engines }: { engines: Set<FetchEngine> }) {
  return (
    <ul className="flex items-center gap-1.5" aria-label="Evidence sources">
      {uniqueSources(FETCH_ENGINES).map((engine) => {
        const on = [...engines].some((have) => sameSource(have, engine));
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
          className="size-8"
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

export type BrandRowData = {
  brand: BrandDoc;
  own: boolean;
  claimCount: number | undefined;
  latestCheckAt: string | undefined;
  engines: Set<FetchEngine>;
};

const STALE_MS = STALE_CHECK_DAYS * 24 * 60 * 60 * 1000;

function LatestCheck({ at }: { at: string | undefined }) {
  const [now] = useState(() => Date.now());
  if (!at) return <span className="text-xs text-fg-tertiary">None yet</span>;
  if (now - Date.parse(at) <= STALE_MS) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <Chip variant="status" tone="warn">Stale</Chip>
      <RelativeTime iso={at} className="font-mono text-xs tabular-nums text-fg-secondary" />
    </span>
  );
}

export const brandColumns: DataTableColumn<BrandRowData>[] = [
  {
    id: "brand",
    header: "Brand",
    kind: "primary",
    cell: ({ brand, own }) => (
      <div className="flex min-w-0 items-center gap-3">
        <BrandMark name={brand.name} domain={brand.domain} className="size-9" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/brands/${brand._id}`}
              className="truncate text-[15px] font-semibold tracking-[-0.015em] text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {brand.name}
            </Link>
            {own ? (
              <Chip variant="you" size="sm" className="shrink-0 font-mono">
                You
              </Chip>
            ) : null}
          </div>
          <p className="truncate text-xs text-fg-secondary">
            {brand.domain} · {categoryLabel(brand.vertical)}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    className: "w-36",
    cell: ({ brand }) => <StatusChip status={brand.profileStatus} />,
  },
  {
    id: "findings",
    header: "Findings",
    kind: "numeric",
    className: "w-28",
    cell: ({ claimCount }) => (claimCount === undefined ? "-" : claimCount.toLocaleString("en-US")),
  },
  {
    id: "latest",
    header: "Latest check",
    className: "w-48",
    cell: ({ latestCheckAt }) => <LatestCheck at={latestCheckAt} />,
  },
  {
    id: "sources",
    header: "Sources",
    className: "w-40",
    cell: ({ engines }) => <SourceMarks engines={engines} />,
  },
  {
    id: "menu",
    header: "Actions",
    kind: "action",
    cell: ({ brand, own }) => <RowMenu brand={brand} own={own} />,
  },
];
