"use client";


import { useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import { MessageAction, MessageActions } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { iconProps } from "../tokens";

export function CopyAction({
  text,
  className,
  copyLabel = "Copy",
  copiedLabel = "Copied",
}: {
  text: string;
  className?: string;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  }

  return (
    <MessageAction
      aria-label={copied ? copiedLabel : copyLabel}
      title={copied ? copiedLabel : copyLabel}
      tooltip={copied ? copiedLabel : copyLabel}
      onClick={() => void handleCopy()}
      className={cn("size-6 rounded-md text-fg-tertiary hover:text-fg", className)}
    >
      {copied ? (
        <Check {...iconProps} className="size-3.5 text-ok" aria-hidden="true" />
      ) : (
        <Copy {...iconProps} className="size-3.5" aria-hidden="true" />
      )}
    </MessageAction>
  );
}

export function AnswerActions({
  text,
  visible,
  onRetry,
}: {
  text: string;
  visible: boolean;
  onRetry?: () => void;
}) {
  return (
    <MessageActions
      className={cn(
        "gap-0.5 transition-opacity duration-[250ms] ease-out",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <CopyAction text={text} copyLabel="Copy answer" copiedLabel="Copied" />
      <MessageAction
        aria-label="Retry this answer"
        title="Retry"
        tooltip="Retry"
        onClick={onRetry}
        disabled={onRetry === undefined}
        className="size-6 rounded-md text-fg-tertiary hover:text-fg"
      >
        <RotateCcw {...iconProps} className="size-3.5" aria-hidden="true" />
      </MessageAction>
    </MessageActions>
  );
}
