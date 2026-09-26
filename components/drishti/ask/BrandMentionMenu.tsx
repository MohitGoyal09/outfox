"use client";


import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export type MentionBrand = {
  id: Id<"brands">;
  name: string;
};

export function mentionOptionId(listboxId: string, brandId: Id<"brands">): string {
  return `${listboxId}-option-${brandId}`;
}

export function filterMentionBrands(
  brands: MentionBrand[],
  token: string,
  max = 6,
): MentionBrand[] {
  const needle = token.trim().toLowerCase();
  const matches =
    needle === ""
      ? brands
      : brands.filter((brand) => brand.name.toLowerCase().includes(needle));
  return matches.slice(0, max);
}

export function BrandMentionMenu({
  id,
  brands,
  highlightedIndex,
  onSelect,
}: {
  id: string;
  brands: MentionBrand[];
  highlightedIndex: number;
  onSelect: (brand: MentionBrand) => void;
}) {
  if (brands.length === 0) {
    return (
      <div
        id={id}
        role="listbox"
        aria-label="Brands"
        className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-border-strong bg-bg-raised p-2 text-[12.5px] text-fg-tertiary shadow-lg"
      >
        No matching brands.
      </div>
    );
  }

  return (
    <div
      id={id}
      role="listbox"
      aria-label="Brands"
      className="absolute bottom-full left-0 mb-2 max-h-64 w-64 overflow-y-auto rounded-lg border border-border-strong bg-bg-raised p-1 shadow-lg"
    >
      {brands.map((brand, index) => {
        const active = index === highlightedIndex;
        return (
          <div
            key={String(brand.id)}
            id={mentionOptionId(id, brand.id)}
            role="option"
            aria-selected={active}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(brand);
            }}
            className={cn(
              "cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] text-fg",
              active ? "bg-accent-dim text-fg" : "hover:bg-bg-inset",
            )}
          >
            {brand.name}
          </div>
        );
      })}
    </div>
  );
}
