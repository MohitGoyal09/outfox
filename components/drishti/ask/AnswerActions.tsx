"use client";


import { useState } from "react";
import { Check, Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { MessageAction, MessageActions } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";

export function AnswerActions({
  text,
  visible,
  onRetry,
}: {
  text: string;
  visible: boolean;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  }

  return (
    <MessageActions
      className={cn(
        "transition-opacity duration-[250ms] ease-out",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <MessageAction tooltip={copied ? "Copied" : "Copy"} onClick={() => void handleCopy()}>
        {copied ? <Check className="size-[15px] text-ok" aria-hidden="true" /> : <Copy className="size-[15px]" aria-hidden="true" />}
      </MessageAction>
      <MessageAction tooltip="Retry" onClick={onRetry} disabled={onRetry === undefined}>
        <RotateCcw className="size-[15px]" aria-hidden="true" />
      </MessageAction>
      <MessageAction
        tooltip="Good answer"
        aria-pressed={vote === "up"}
        onClick={() => setVote((v) => (v === "up" ? null : "up"))}
      >
        <ThumbsUp className={cn("size-[15px]", vote === "up" && "fill-current text-accent")} aria-hidden="true" />
      </MessageAction>
      <MessageAction
        tooltip="Bad answer"
        aria-pressed={vote === "down"}
        onClick={() => setVote((v) => (v === "down" ? null : "down"))}
      >
        <ThumbsDown className={cn("size-[15px]", vote === "down" && "fill-current text-danger")} aria-hidden="true" />
      </MessageAction>
    </MessageActions>
  );
}
