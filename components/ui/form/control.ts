export const controlClass =
  "w-full min-w-0 rounded-sm border border-border-strong bg-bg-raised px-3 text-[15px] text-fg outline-none " +
  "transition-[border-color,box-shadow] duration-150 placeholder:text-fg-placeholder " +
  "hover:border-[color-mix(in_srgb,var(--text-primary)_40%,transparent)] " +
  "focus-visible:border-fg focus-visible:ring-3 focus-visible:ring-[var(--accent-dim)] " +
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-bg-inset disabled:text-fg-tertiary disabled:hover:border-border " +
  "aria-invalid:border-danger aria-invalid:hover:border-danger aria-invalid:focus-visible:border-danger " +
  "aria-invalid:focus-visible:ring-[color-mix(in_srgb,var(--danger)_22%,transparent)] " +
  "motion-safe:aria-invalid:animate-[field-nudge_150ms_ease-out]";

export const controlHeight = { default: "h-10", sm: "h-8" } as const;
export type ControlSize = keyof typeof controlHeight;
