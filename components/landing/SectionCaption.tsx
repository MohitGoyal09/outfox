export function SectionCaption({ items, className = "" }: { items: readonly string[]; className?: string }) {
  return (
    <p className={`mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase leading-[1.4] tracking-[0.08em] text-fg-tertiary ${className}`}>
      {items.map((t) => (
        <span key={t}>&bull; {t}</span>
      ))}
    </p>
  );
}
