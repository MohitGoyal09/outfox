"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Check, Copy, Share2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "../Button";
import { iconProps } from "../tokens";

export function ShareDialog({
  boardId,
  shared,
  open,
  onOpenChange,
}: {
  boardId: Id<"boards">;
  shared: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const enableShare = useMutation(api.boardCanvas.enableShare);
  const disableShare = useMutation(api.boardCanvas.disableShare);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !shared || token !== null) return;
    let live = true;
    enableShare({ boardId })
      .then((t) => live && setToken(t))
      .catch(() => toast.error("Could not load the share link. Try again."));
    return () => {
      live = false;
    };
  }, [open, shared, token, boardId, enableShare]);

  const link = token && typeof window !== "undefined" ? `${window.location.origin}/share/board/${token}` : "";

  async function turnOn() {
    setBusy(true);
    try {
      setToken(await enableShare({ boardId }));
    } catch {
      toast.error("Could not turn on sharing. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      await disableShare({ boardId });
      setToken(null);
      toast.success("Sharing is off. The old link no longer works.");
    } catch {
      toast.error("Could not turn off sharing. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function rotate() {
    setBusy(true);
    try {
      await disableShare({ boardId });
      setToken(await enableShare({ boardId }));
      toast.success("New link made. The old link no longer works.");
    } catch {
      toast.error("Could not make a new link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the link and copy it by hand.");
    }
  }

  const on = shared || token !== null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this board</DialogTitle>
          <DialogDescription>Anyone with the link can view this board read-only: its name, your notes and frames, and the saved findings with their text and source links. Turn sharing off to make the link stop working.</DialogDescription>
        </DialogHeader>
        {on ? (
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              aria-label="Share link"
              onFocus={(e) => e.currentTarget.select()}
              className="focus-ring h-9 min-w-0 flex-1 rounded-sm border border-border-strong bg-bg-inset px-3 text-[12px] text-fg"
            />
            <Button
              size="sm"
              disabled={link === ""}
              onClick={() => void copy()}
              icon={copied ? <Check {...iconProps} size={14} aria-hidden="true" className="size-3.5" /> : <Copy {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}
            >
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        ) : null}
        <DialogFooter>
          {on ? (
            <Button variant="ghost" onClick={() => void rotate()} disabled={busy || token === null}>
              Make a new link
            </Button>
          ) : null}
          {on ? (
            <Button variant="danger" onClick={() => void turnOff()} loading={busy}>
              Turn off sharing
            </Button>
          ) : (
            <Button onClick={() => void turnOn()} loading={busy} icon={<Share2 {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}>
              Create share link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
