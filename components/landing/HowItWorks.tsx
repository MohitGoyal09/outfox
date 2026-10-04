import Image from "next/image";
import { MARK_STROKE } from "@/lib/brandMark";

function Marker({ kind }: { kind: "circle" | "line" | "dot" }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="text-fg">
      
      {kind === "line" ? <line x1="6" y1="26" x2="26" y2="6" stroke="currentColor" strokeWidth={MARK_STROKE * 0.5} strokeLinecap="butt" /> : null}
      {kind === "dot" ? <circle cx="16" cy="16" r="10" fill="currentColor" /> : null}
    </svg>
  );
}

const SHOT = { w: 1440, h: 770 };
type Crop = { src: string; alt: string; x: number; y: number; w: number };

function ShotCrop({ crop }: { crop: Crop }) {
  const h = (crop.w * 7) / 8;
  return (
    <div className="relative aspect-[8/7] overflow-hidden rounded-[12px] border border-border-strong bg-bg shadow-xs">
      <Image
        src={crop.src}
        alt={crop.alt}
        width={SHOT.w}
        height={SHOT.h}
        sizes="(min-width: 768px) 520px, 90vw"
        className="absolute max-w-none"
        style={{ width: `${(SHOT.w / crop.w) * 100}%`, left: `${(-crop.x / crop.w) * 100}%`, top: `${(-crop.y / h) * 100}%` }}
      />
    </div>
  );
}
