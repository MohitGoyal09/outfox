"use client";


import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type PromptInputContextValue = {
  maxHeight: number;
  onSubmit?: () => void;
  locked: boolean;
};

const PromptInputContext = createContext<PromptInputContextValue>({
  maxHeight: 220,
  locked: false,
});

export function PromptInput({
  maxHeight = 220,
  locked = false,
  onSubmit,
  className,
  children,
  ...props
}: {
  maxHeight?: number;
  locked?: boolean;
  onSubmit?: () => void;
} & ComponentProps<"div">) {
  const ctx = useMemo(() => ({ maxHeight, onSubmit, locked }), [maxHeight, onSubmit, locked]);
  return (
    <PromptInputContext.Provider value={ctx}>
      <div
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button, a, input, [role=menu]")) return;
          event.currentTarget.querySelector("textarea")?.focus();
        }}
        className={className}
        {...props}
      >
        {children}
      </div>
    </PromptInputContext.Provider>
  );
}

export const PromptInputTextarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
  function PromptInputTextarea({ className, onKeyDown, value, rows = 1, ...props }, ref) {
    const { maxHeight, onSubmit, locked } = useContext(PromptInputContext);
    const inner = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => inner.current as HTMLTextAreaElement);

    const resize = useCallback(() => {
      const el = inner.current;
      if (el === null) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    }, [maxHeight]);

    useEffect(resize, [resize, value]);

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
      event.preventDefault();
      if (!locked) onSubmit?.();
    }

    return (
      <textarea
        ref={inner}
        value={value}
        rows={rows}
        onKeyDown={handleKeyDown}
        style={{ maxHeight }}
        className={cn("resize-none outline-none focus-visible:outline-none", className)}
        {...props}
      />
    );
  },
);

export function PromptInputActions({ className, children, ...props }: { children: ReactNode } & ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}
