export function DotGrid({ className, id = "l-dot-grid", color = "var(--border-strong)" }: { className?: string; id?: string; color?: string }) {
  return (
    <svg aria-hidden="true" className={className}>
      
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
