import { Newspaper, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { sourceName } from "@/components/drishti/labels";

export function PlatformLogo({
  engine,
  className,
}: {
  engine: string;
  className?: string;
}) {
  if (engine === "google_news") {
    return <Newspaper aria-hidden className={cn("shrink-0", className)} />;
  }

  if (engine === "google_trends") {
    return <TrendingUp aria-hidden className={cn("shrink-0", className)} />;
  }

  if (engine === "youtube" || engine === "youtube_video") {
    return (
      <svg aria-hidden viewBox="0 0 256 180" className={cn("shrink-0", className)}>
        <path fill="#ff0000" d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134" />
        <path fill="#fff" d="m102.421 128.06l66.328-38.418l-66.328-38.418z" />
      </svg>
    );
  }

  if (engine === "google_ads_transparency_center") {
    return (
      <svg aria-hidden viewBox="0 0 256 230" className={cn("shrink-0", className)}>
        <path fill="#fbbc04" d="M5.888 166.405L90.88 20.9c10.796 6.356 65.236 36.484 74.028 42.214L79.916 208.627c-9.295 12.28-85.804-23.587-74.028-42.23z" />
        <path fill="#4285f4" d="M250.084 166.402L165.092 20.906C153.21 1.132 127.62-6.054 106.601 5.625S79.182 42.462 91.064 63.119l84.992 145.514c11.882 19.765 37.473 26.95 58.492 15.272c20.1-11.68 27.418-37.73 15.536-57.486z" />
        <ellipse cx="42.664" cy="187.924" fill="#34a853" rx="42.664" ry="41.604" />
      </svg>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 256 262" className={cn("shrink-0", className)}>
      <path fill="#4285f4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" />
      <path fill="#34a853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" />
      <path fill="#fbbc05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z" />
      <path fill="#eb4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" />
    </svg>
  );
}

export function EngineTag({ engine, className }: { engine: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      <PlatformLogo engine={engine} className="size-3" />
      {sourceName(engine)}
    </span>
  );
}
