"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { categoricalColorFor } from "@/components/drishti/tokens";

export function BrandMark({
  name,
  domain,
  className,
}: {
  name: string;
  domain: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const host = domain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;

  return (
    <span
      className={cn(
        "relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-border text-sm font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: categoricalColorFor(name) }}
    >
      <span aria-hidden>{name.slice(0, 1).toUpperCase()}</span>
      {!failed ? (
        <img
          src={favicon}
          alt={`${name} logo`}
          className="absolute inset-0 size-full bg-white object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}
