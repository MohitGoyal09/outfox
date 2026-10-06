"use client";


import type { AriaAttributes, ChangeEvent, KeyboardEvent, ReactNode, RefObject } from "react";
import type { ChatStatus } from "ai";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PromptInput, PromptInputActions, PromptInputTextarea } from "@/components/ui/prompt-input";
import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { SOURCES } from "@/components/landing/landing-data";
import { STATE_TRANSITION_CLASS } from "../tokens";
import { AskSubmitButton } from "./AskSubmitButton";

export type AskContextChip = { id: string; name: string };

const QUIET_BTN =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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
  autoFocus,
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
  autoFocus?: boolean;
  className?: string;
}) {
  const send = () => {
    if (canSend && !overCap && !disabled) onSubmit(value);
  };
  const sendable = canSend && !overCap;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {overlay}
        <PromptInput
          onSubmit={send}
          locked={disabled}
          className={cn(
            "overflow-hidden rounded-3xl border border-border-strong bg-bg-raised shadow-[var(--shadow-sm)]",
            "motion-safe:transition-[box-shadow,border-color] motion-safe:duration-150 motion-safe:ease-out",
            "focus-within:border-accent/35 focus-within:shadow-[var(--shadow-md)]",
          )}
        >
          <div className="flex items-end gap-3 py-2 pl-5 pr-2">
            <PromptInputTextarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              readOnly={disabled}
              autoFocus={autoFocus}
              aria-busy={disabled || undefined}
              placeholder={placeholder}
              className={cn(
                "min-w-0 flex-1 self-stretch overflow-y-auto bg-transparent py-2 text-base leading-6 text-fg placeholder:text-fg-tertiary",
                "motion-safe:transition-opacity motion-safe:duration-150",
                disabled && "opacity-70",
              )}
              {...textareaAria}
            />
            <AskSubmitButton status={status} canSend={sendable} onSend={send} onStop={onStop} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-border bg-bg-inset px-5 py-2">
            <PromptInputActions className="min-w-0 flex-wrap gap-x-2 gap-y-1.5">
              <span className="whitespace-nowrap text-[12px] text-fg-secondary">Ask across</span>
              <span className="flex items-center gap-1.5" role="group" aria-label="Sources Outfox reads">
                {SOURCES.map((source) => (
                  <span
                    key={source.engine}
                    title={source.name}
                    className="flex size-6 items-center justify-center rounded-full border border-border bg-white"
                  >
                    <PlatformLogo engine={source.engine} className="size-3.5" />
                    <span className="sr-only">{source.name}</span>
                  </span>
                ))}
              </span>
              {chips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex h-6 items-center gap-0.5 rounded-full border border-border bg-white pl-2.5 pr-0.5 text-[12px] text-fg-secondary"
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
                        "hover:bg-bg-inset hover:text-fg",
                        QUIET_BTN,
                      )}
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              ))}
            </PromptInputActions>
            <PromptInputActions className="gap-1.5">
              {overCap ? (
                <span role="alert" className="font-mono text-[11px] tabular-nums text-danger">
                  {value.length}/{maxChars}
                </span>
              ) : null}
              {onClear ? (
                <button
                  type="button"
                  onClick={onClear}
                  aria-label="Clear this conversation"
                  className={cn(
                    "rounded-full px-2 py-1 text-[12px] text-fg-tertiary",
                    STATE_TRANSITION_CLASS,
                    "hover:text-fg-secondary",
                    QUIET_BTN,
                  )}
                >
                  Clear
                </button>
              ) : null}
              {trailing}
              {onMention ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onMention}
                      aria-label="Reference a brand"
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-fg-secondary",
                        STATE_TRANSITION_CLASS,
                        "hover:bg-white hover:text-fg",
                        QUIET_BTN,
                      )}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Reference a brand (@)</TooltipContent>
                </Tooltip>
              ) : null}
            </PromptInputActions>
          </div>
        </PromptInput>
      </div>
      {note}
    </div>
  );
}
