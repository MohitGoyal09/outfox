import { cn } from "@/lib/utils";
import { PlatformLogo } from "../brands/PlatformLogo";
import { Chip } from "../Chip";
import { LABEL_CLASS } from "../tokens";
import type { CitationCardView } from "./ask-model";

export function CitationCard({
  citation,
  id,
  focused = false,
}: {
  citation: CitationCardView;
  id?: string;
  focused?: boolean;
}) {
  if (citation.href === null) {
    return (
      <span id={id} className="contents">
        <Chip pressed={focused} title={citation.displayText}>
          {citation.label}
        </Chip>
      </span>
    );
  }

  if (citation.thumbnailUrl === null) {
    return (
      <span id={id} className="contents">
        <Chip
          pressed={focused}
          href={citation.href}
          title={`${citation.brandName} · ${citation.displayText}`}
        >
          {citation.label}
        </Chip>
      </span>
    );
  }

  return (
    <a
      id={id}
      href={citation.href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "flex w-[212px] shrink-0 flex-col gap-2 rounded-[10px] border border-border bg-bg-raised p-2.5 transition-colors duration-150 ease-out hover:border-accent/50 hover:bg-accent-dim",
        focused && "border-accent ring-1 ring-accent",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn(LABEL_CLASS, "text-fg-tertiary")}>{citation.label}</span>
        <PlatformLogo engine={citation.sourceEngine} className="size-3.5 text-fg-tertiary" />
        <span className="truncate text-[11px] text-fg-tertiary">{citation.brandName}</span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-[6px] bg-bg-inset">
        <img src={citation.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" />
      </div>

      <p className="line-clamp-2 text-[12px] leading-4 text-fg">{citation.displayText}</p>

      {citation.tag !== null ? (
        <div className="flex flex-col gap-1.5 border-t border-border pt-2">
          <div className="flex flex-wrap gap-1">
            <Chip value={citation.tag.hookType} scale="hook" size="sm">
              {citation.tag.hookType.replaceAll("_", " ")}
            </Chip>
            <Chip value={citation.tag.funnelStage} scale="funnel" size="sm">
              {citation.tag.funnelStage.replaceAll("_", " ")}
            </Chip>
          </div>
          {citation.tag.theme || citation.tag.valueProp || citation.tag.cta ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-0.5 text-[10.5px] leading-4">
              {citation.tag.theme ? (
                <>
                  <dt className="text-fg-tertiary">Theme</dt>
                  <dd className="truncate text-fg-secondary">{citation.tag.theme}</dd>
                </>
              ) : null}
              {citation.tag.valueProp ? (
                <>
                  <dt className="text-fg-tertiary">Value</dt>
                  <dd className="truncate text-fg-secondary">{citation.tag.valueProp}</dd>
                </>
              ) : null}
              {citation.tag.cta ? (
                <>
                  <dt className="text-fg-tertiary">CTA</dt>
                  <dd className="truncate text-fg-secondary">{citation.tag.cta}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
        </div>
      ) : null}
    </a>
  );
}
