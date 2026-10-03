import { MARK_CLAIM, MARK_LINK, MARK_SOURCE, MARK_STROKE, MARK_VIEWBOX } from "@/lib/brandMark";

export function DrishtiMark({ size = 20, title, className }: { size?: number; title?: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <circle cx={MARK_CLAIM.cx} cy={MARK_CLAIM.cy} r={MARK_CLAIM.r} fill="none" stroke="currentColor" strokeWidth={MARK_STROKE} />
      <line x1={MARK_LINK.x1} y1={MARK_LINK.y1} x2={MARK_LINK.x2} y2={MARK_LINK.y2} stroke="currentColor" strokeWidth={MARK_STROKE} />
      <circle cx={MARK_SOURCE.cx} cy={MARK_SOURCE.cy} r={MARK_SOURCE.r} fill="currentColor" />
    </svg>
  );
}
