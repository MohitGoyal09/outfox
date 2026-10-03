import type { IconType } from "react-icons";
import {
  SiGoogle,
  SiGoogleads,
  SiGooglenews,
  SiYoutube,
} from "react-icons/si";
import { Globe, Tag, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconProps, sourceColor } from "@/components/drishti/tokens";
import { sourceName } from "@/components/drishti/labels";
import {
  GoogleAdsMark,
  GoogleMark,
  GoogleNewsMark,
  GoogleTrendsMark,
  YouTubeMark,
} from "@/components/drishti/brands/brandMarks";

const COLOR_MARKS: Record<string, typeof GoogleMark> = {
  google: GoogleMark,
  google_ads_transparency_center: GoogleAdsMark,
  google_news: GoogleNewsMark,
  google_trends: GoogleTrendsMark,
  youtube: YouTubeMark,
  youtube_video: YouTubeMark,
};

const MUTED_MARKS: Record<string, IconType> = {
  google: SiGoogle,
  google_ads_transparency_center: SiGoogleads,
  google_news: SiGooglenews,
  youtube: SiYoutube,
  youtube_video: SiYoutube,
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

  if (!muted) {
    const Color = COLOR_MARKS[engine];
    if (Color) {
      return <Color className={cn("size-4 shrink-0", className)} />;
    }
  }

  const Muted = muted ? MUTED_MARKS[engine] : undefined;
  if (Muted) {
    return <Muted aria-hidden className={cn("size-4 shrink-0", className)} />;
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
        "inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-fg-secondary",
        className,
      )}
    >
      <PlatformLogo engine={engine} className="size-3" />
      {sourceName(engine)}
    </span>
  );
}
