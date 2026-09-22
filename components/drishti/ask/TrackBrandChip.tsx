"use client";


import { useState } from "react";
import { Chip } from "../Chip";

export function TrackBrandChip({
  brandName,
  onTrack,
}: {
  brandName: string;
  onTrack?: () => Promise<void>;
}) {
  const [state, setState] = useState<"idle" | "pending" | "error">("idle");

  async function handleClick() {
    if (onTrack === undefined || state === "pending") return;
    setState("pending");
    try {
      await onTrack();
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <Chip
      tone={state === "error" ? "danger" : "ok"}
      loading={state === "pending"}
      error={state === "error"}
      disabled={onTrack === undefined}
      onClick={onTrack !== undefined ? () => void handleClick() : undefined}
      title={
        onTrack === undefined
          ? `No wired path creates a brand from just a name yet (${brandName})`
          : state === "error"
            ? "Could not track this brand — try again"
            : `Track ${brandName}`
      }
    >
      {state === "error" ? "Track failed — retry" : `Track ${brandName}`}
    </Chip>
  );
}
