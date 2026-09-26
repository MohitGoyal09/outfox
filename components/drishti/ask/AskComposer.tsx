"use client";


import type { AriaAttributes, ChangeEvent, KeyboardEvent, ReactNode, RefObject } from "react";
import type { ChatStatus } from "ai";
import { ArrowUp, CircleAlert, Plus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { STATE_TRANSITION_CLASS } from "../tokens";

export type AskContextChip = { id: string; name: string };

export function AskComposer({
  value,
  onChange,
  onKeyDown,
  onSubmit,
  status,
  onStop,
  disabled,
  canSend,
  overCap,
  maxChars,
  placeholder,
  textareaRef,
  textareaAria,
  chips = [],
  onRemoveChip,
  onMention,
  onClear,
  trailing,
  overlay,
  note,
  className,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (text: string) => void;
  status: ChatStatus;
  onStop: () => void;
  disabled: boolean;
  canSend: boolean;
  overCap: boolean;
  maxChars: number;
  placeholder: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  textareaAria?: AriaAttributes & { role?: "combobox" };
  chips?: AskContextChip[];
  onRemoveChip?: (id: string) => void;
  onMention?: () => void;
  onClear?: () => void;
  trailing?: ReactNode;
  overlay?: ReactNode;
  note?: ReactNode;
  className?: string;
}) {
  const generating = status === "submitted" || status === "streaming";

  const icon =
    status === "submitted" ? (
      <Spinner className="size-4" />
    ) : status === "streaming" ? (
      <Square className="size-3.5" aria-hidden="true" />
    ) : status === "error" ? (
      <CircleAlert className="size-4" aria-hidden="true" />
    ) : (
      <ArrowUp className="size-4" strokeWidth={3} aria-hidden="true" />
    );

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {overlay}
        <PromptInput
          onSubmit={(message) => onSubmit(message.text)}
          className={cn(
            "rounded-2xl border border-border-strong bg-bg-raised shadow-[var(--shadow-sm)]",
            "motion-safe:transition-[box-shadow,border-color] motion-safe:duration-150 motion-safe:ease-out",
            "focus-within:border-border-strong focus-within:shadow-[var(--shadow-md)]",
            "hover:shadow-[var(--shadow-md)]",
          )}
        >
          <PromptInputBody>
            <PromptInputTextarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              disabled={disabled}
              rows={3}
              placeholder={placeholder}
              className="max-h-[300px] min-h-[52px] overflow-y-auto bg-transparent px-4 pt-3.5 pb-2 text-[14px] leading-6 text-fg placeholder:text-fg-placeholder"
              {...textareaAria}
            />
          </PromptInputBody>
          <PromptInputFooter className="items-center gap-2 rounded-b-2xl px-3 pt-0.5 pb-2.5">
            <PromptInputTools className="min-w-0 flex-wrap gap-1.5">
              {onMention ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onMention}
                      aria-label="Reference a brand"
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-bg-inset text-fg-secondary",
                        STATE_TRANSITION_CLASS,
                        "hover:border-border-strong hover:bg-bg-raised hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      )}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Reference a brand (@)</TooltipContent>
                </Tooltip>
              ) : null}
              {chips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-bg-inset pl-2.5 pr-1 text-[11.5px] text-fg-secondary"
                >
                  {chip.name}
                  {onRemoveChip ? (
                    <button
                      type="button"
                      aria-label={`Remove ${chip.name} from context`}
                      onClick={() => onRemoveChip(chip.id)}
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-fg-tertiary",
                        STATE_TRANSITION_CLASS,
                        "hover:bg-bg-raised-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      )}
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              ))}
            </PromptInputTools>
            <div className="flex items-center gap-2.5">
              {onClear ? (
                <button
                  type="button"
                  onClick={onClear}
                  aria-label="Clear this conversation"
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11.5px] font-medium text-fg-tertiary",
                    STATE_TRANSITION_CLASS,
                    "hover:bg-bg-inset hover:text-fg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  )}
                >
                  Clear
                </button>
              ) : null}
              {trailing}
              {overCap ? (
                <span
                  role="alert"
                  className="font-mono text-[11px] tabular-nums text-danger"
                >
                  {value.length}/{maxChars}
                </span>
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <PromptInputSubmit
                      status={status}
                      onStop={onStop}
                      disabled={generating ? false : !canSend || overCap}
                      aria-label={generating ? "Stop" : "Send"}
                      className={cn(
                        "size-10 rounded-full shadow-[var(--shadow-xs)]",
                        generating
                          ? "bg-danger text-white hover:bg-danger/90"
                          : canSend && !overCap
                            ? "bg-accent text-accent-ink hover:bg-accent-strong"
                            : "bg-bg-inset text-fg",
                        "disabled:pointer-events-auto disabled:cursor-not-allowed disabled:bg-bg-inset disabled:text-fg-secondary disabled:opacity-100",
                      )}
                    >
                      {icon}
                    </PromptInputSubmit>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {generating
                    ? "Stop generating"
                    : canSend && !overCap
                      ? "Send"
                      : "Type a question to send"}
                </TooltipContent>
              </Tooltip>
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
      {note}
    </div>
  );
}
