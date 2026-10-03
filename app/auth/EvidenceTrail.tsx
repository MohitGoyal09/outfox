import { PlatformLogo } from "@/components/drishti/brands/PlatformLogo";
import { sourceName } from "@/components/drishti/labels";

const TRAIL = [
  { engine: "google", line: "w-16" },
  { engine: "youtube_video", line: "w-32" },
  { engine: "google_ads_transparency_center", line: "w-24" },
  { engine: "google_news", line: "w-40" },
  { engine: "google_trends", line: "w-20" },
] as const;

export function EvidenceTrail() {
  return (
    <div aria-hidden="true">
      <p className="mb-5 text-[12px] font-medium text-accent-ink/55">
        Every claim links to its source
      </p>
      <div className="space-y-3">
        {TRAIL.map(({ engine, line }) => (
          <div key={engine} className="flex items-center">
            <span className="size-3.5 shrink-0 rounded-full border-2 border-accent-ink/70" />
            <span className={`h-px ${line} bg-accent-ink/25`} />
            <span className="size-2.5 shrink-0 rounded-full bg-accent-ink" />
            <span className="ml-3 flex items-center gap-2 rounded-full border border-accent-ink/10 bg-accent-ink/[0.06] px-3 py-1.5 text-sm text-accent-ink/85">
              <PlatformLogo engine={engine} />
              {sourceName(engine)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
