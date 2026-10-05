"use client";


import { ArrowUpRight } from "lucide-react";
import { isHttpUrl, NOTE_COLOR_CSS, isNoteColor, nodesInsideFrame } from "@/convex/lib/canvasModel";
import { displayClaimText } from "../brands/format";
import { PlatformLogo } from "../brands/PlatformLogo";
import { sourceName } from "../labels";
import { iconProps } from "../tokens";
import { adLine, CardBrand, CardTags, CardThumb } from "./claim-card-parts";
import { toNodeId, type FlowCanvas, type FlowItem, type FlowNote } from "./canvas-flow";
import { ITEM_W, ITEM_H } from "@/convex/lib/canvasModel";

const PREVIEW_CHARS = 48;
const clip = (text: string) => (text.length > PREVIEW_CHARS ? `${text.slice(0, PREVIEW_CHARS)}…` : text);

function ItemCard({ item }: { item: FlowItem }) {
  const claim = item.claim;
  if (claim === null) {
    return (
      <li className="rounded-lg border border-dashed border-border-strong bg-bg-inset p-3.5 text-[13px] text-fg-secondary">
        This finding is no longer stored.
      </li>
    );
  }
  return (
    <li className="rounded-lg border border-border bg-bg-raised p-3.5 shadow-xs">
      {claim.brandName ? <div className="mb-2"><CardBrand claim={claim} /></div> : null}
      <div className="flex items-center gap-2">
        <PlatformLogo engine={claim.sourceEngine} className="size-4" />
        <span className="text-[12px] font-semibold text-fg">{sourceName(claim.sourceEngine)}</span>
      </div>
      <CardThumb claim={claim} className="mt-2 h-32" />
      <p className="mt-2 line-clamp-4 text-[13px] font-medium leading-[1.4] text-fg">{adLine(claim) ?? displayClaimText(claim.text)}</p>
      {claim.tagHook || claim.tagStage ? <div className="mt-2 flex flex-wrap gap-1.5"><CardTags claim={claim} /></div> : null}
      {isHttpUrl(claim.evidenceUrl) ? (
        <a
          href={claim.evidenceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="focus-ring mt-2 inline-flex min-h-8 items-center gap-1 rounded-sm text-[12px] font-medium text-fg-secondary"
        >
          Open source
          <ArrowUpRight {...iconProps} size={13} aria-hidden="true" className="size-3.5" />
        </a>
      ) : (
        <p className="mt-2 break-all text-[12px] text-fg-tertiary">{claim.evidenceUrl}</p>
      )}
    </li>
  );
}

function NoteCard({ note }: { note: FlowNote }) {
  const color = isNoteColor(note.color) ? note.color : "amber";
  return (
    <li className="whitespace-pre-wrap break-words rounded-md border border-border-strong p-3 text-[13px] leading-5 text-fg" style={{ backgroundColor: NOTE_COLOR_CSS[color] }}>
      {note.text || <span className="text-fg-tertiary">Empty note</span>}
    </li>
  );
}

export function BoardCanvasList({ canvas }: { canvas: FlowCanvas }) {
  const boxes = [
    ...canvas.items.map((i) => ({ key: toNodeId({ kind: "item", id: i.id }), x: i.x, y: i.y, w: ITEM_W, h: ITEM_H })),
    ...canvas.notes.map((n) => ({ key: toNodeId({ kind: "note", id: n.id }), x: n.x, y: n.y, w: n.w, h: n.h })),
  ];
  const sections = canvas.frames
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((f) => ({ f, keys: new Set(nodesInsideFrame({ key: toNodeId({ kind: "frame", id: f.id }), x: f.x, y: f.y, w: f.w, h: f.h }, boxes)) }));
  const claimed = new Set(sections.flatMap((s) => [...s.keys]));

  const render = (keys: ReadonlySet<string> | null) => {
    const include = (key: string) => (keys ? keys.has(key) : !claimed.has(key));
    const items = canvas.items.filter((i) => include(toNodeId({ kind: "item", id: i.id })));
    const notes = canvas.notes.filter((n) => include(toNodeId({ kind: "note", id: n.id })));
    if (items.length + notes.length === 0) return null;
    return (
      <ul className="flex flex-col gap-2.5">
        {notes.map((n) => <NoteCard key={n.id} note={n} />)}
        {items.map((i) => <ItemCard key={i.id} item={i} />)}
      </ul>
    );
  };

  const labelOf = (kind: string, id: string): string => {
    if (kind === "note") return clip(canvas.notes.find((n) => n.id === id)?.text || "Empty note");
    if (kind === "frame") return canvas.frames.find((f) => f.id === id)?.title ?? "Frame";
    const claim = canvas.items.find((i) => i.id === id)?.claim;
    return claim ? clip(displayClaimText(claim.text)) : "Removed finding";
  };

  const loose = render(null);
  const empty = canvas.items.length + canvas.notes.length + canvas.frames.length === 0;
  return (
    <div className="flex flex-col gap-6" aria-label="Board contents">
      {empty ? <p className="text-[13px] text-fg-secondary">Nothing on this board yet.</p> : null}
      {sections.map(({ f, keys }) => (
        <section key={f.id} aria-label={f.title} className="flex flex-col gap-2.5">
          <h2 className="type-title text-fg">{f.title}</h2>
          {render(keys) ?? <p className="text-[12px] text-fg-tertiary">Nothing in this frame.</p>}
        </section>
      ))}
      {loose ? <section className="flex flex-col gap-2.5">{sections.length > 0 ? <h2 className="type-title text-fg">Not in a frame</h2> : null}{loose}</section> : null}
      {canvas.edges.length > 0 ? (
        <section aria-label="Connections" className="flex flex-col gap-2">
          <h2 className="type-title text-fg">Connections</h2>
          <ul className="flex flex-col gap-1.5 text-[13px] text-fg-secondary">
            {canvas.edges.map((e) => (
              <li key={e.id}>
                {labelOf(e.source.kind, e.source.id)} → {labelOf(e.target.kind, e.target.id)}
                {e.label ? <span className="text-fg-tertiary"> ({e.label})</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
