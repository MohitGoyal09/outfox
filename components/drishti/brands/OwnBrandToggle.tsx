"use client";


import { type MouseEvent, useState } from "react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

export function OwnBrandToggle({
  brandId,
  isOwn,
  size = "sm",
  className,
}: {
  brandId: Id<"brands">;
  isOwn: boolean;
  size?: "xs" | "sm";
  className?: string;
}) {
  const setOwnBrand = useMutation(api.brands.setOwnBrand);
  const clearOwnBrand = useMutation(api.brands.clearOwnBrand);
  const [pending, setPending] = useState(false);

  async function toggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      if (isOwn) await clearOwnBrand({});
      else await setOwnBrand({ brandId });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={pending}
      onClick={(event) => void toggle(event)}
      className={className}
    >
      {pending ? <Loader2 className="size-3 animate-spin" /> : null}
      {isOwn ? "Not my brand" : "This is my brand"}
    </Button>
  );
}
