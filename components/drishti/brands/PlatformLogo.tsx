import type { IconType } from "react-icons";
import {
  SiGoogle,
  SiGoogleads,
  SiGooglenews,
  SiInstagram,
  SiMeta,
  SiTiktok,
  SiYoutube,
} from "react-icons/si";
import { Globe, Tag, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconProps, sourceColor } from "@/components/drishti/tokens";
import { sourceName } from "@/components/drishti/labels";

const BRAND_MARKS: Record<string, IconType> = {
  google: SiGoogle,
  google_ads_transparency_center: SiGoogleads,
  google_news: SiGooglenews,
  youtube: SiYoutube,
  youtube_video: SiYoutube,
  instagram: SiInstagram,
  tiktok: SiTiktok,
  meta: SiMeta,
};

const UI_MARKS: Record<string, LucideIcon> = {
  google_trends: TrendingUp,
  llm_tag: Tag,
};

export function PlatformLogo({
  engine,
  className,
  muted = false,
}: {
  engine: string;
  className?: string;
  muted?: boolean;
}) {
  const color = muted ? undefined : sourceColor(engine);
  const Brand = BRAND_MARKS[engine];
  if (Brand) {
    return (
      <Brand
        aria-hidden
        {...(color !== undefined ? { color } : {})}
        className={cn("size-4 shrink-0", className)}
      />
    );
  }

  const Ui = UI_MARKS[engine];
  if (Ui) {
    return (
      <Ui
        {...iconProps}
        aria-hidden
        {...(color !== undefined ? { style: { color } } : {})}
        className={cn("size-4 shrink-0", className)}
      />
    );
  }

  return (
    <Globe
      {...iconProps}
      aria-hidden
      className={cn("size-4 shrink-0 text-fg-tertiary", className)}
    />
  );
}

export function EngineTag({ engine, className }: { engine: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wide text-fg-secondary",
        className,
      )}
    >
      <PlatformLogo engine={engine} className="size-3" />
      {sourceName(engine)}
    </span>
  );
}
