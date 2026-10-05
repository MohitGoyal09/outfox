export function fieldAria({ id, help, error, required }: { id: string; help?: string; error?: string; required?: boolean }) {
  const ids = [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return {
    id,
    "aria-describedby": ids || undefined,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-required": required ? (true as const) : undefined,
  };
}
