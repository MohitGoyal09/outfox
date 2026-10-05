"use client";


import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Handle,
  NodeResizer,
  Position,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
  type NodeProps,
} from "@xyflow/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isHttpUrl, MAX_EDGE_LABEL, MAX_FRAME_TITLE, MAX_NOTE_TEXT, MIN_SIZE, NOTE_COLORS, NOTE_COLOR_CSS, isNoteColor, type NoteColor } from "@/convex/lib/canvasModel";
import { displayClaimText, shortDate } from "../brands/format";
import { PlatformLogo } from "../brands/PlatformLogo";
import { sourceName } from "../labels";
import { iconProps, sourceColor } from "../tokens";
import { fromNodeId, type FlowClaim } from "./canvas-flow";
import { adLine, CardBrand, CardTags, CardThumb, tagsMayWrap } from "./claim-card-parts";

export type Move = { kind: "item" | "note" | "frame"; id: string; x: number; y: number; w?: number; h?: number };

export type CanvasActions = {
  readOnly: boolean;
  saveNoteText: (id: string, text: string) => void;
  setNoteColor: (id: string, color: NoteColor) => void;
  saveFrameTitle: (id: string, title: string) => void;
  saveEdgeLabel: (id: string, label: string) => void;
  commitMoves: (moves: Move[]) => void;
};

const noop = () => {};
export const CanvasActionsContext = createContext<CanvasActions>({
  readOnly: true,
  saveNoteText: noop,
  setNoteColor: noop,
  saveFrameTitle: noop,
  saveEdgeLabel: noop,
  commitMoves: noop,
});

const NOTE_SAVE_DELAY_MS = 600;
const handleClass = "!size-2.5 !border !border-border-strong !bg-bg-raised";

function Handles({ readOnly }: { readOnly: boolean }) {
  if (readOnly) return null;
  return (
    <>
      <Handle type="target" position={Position.Left} className={handleClass} aria-label="Connect to this node" />
      <Handle type="source" position={Position.Right} className={handleClass} aria-label="Start a connection from this node" />
    </>
  );
}

export function EvidenceNode({ data, selected }: NodeProps) {
  const { readOnly } = useContext(CanvasActionsContext);
  const claim = data.claim as FlowClaim | null;

  if (claim === null) {
    return (
      <article
        aria-label="Evidence card, finding no longer stored"
        className={cn(
          "rounded-lg border border-dashed border-border-strong bg-bg-inset p-3.5",
          selected && "ring-2 ring-accent/40",
        )}
      >
        <p className="text-[13px] leading-5 text-fg-secondary">This finding is no longer stored.</p>
        <Handles readOnly={readOnly} />
      </article>
    );
  }
  const accent = sourceColor(claim.sourceEngine);
  const ad = adLine(claim);
  const hasThumb = Boolean(claim.thumbnailUrl);
  return (
    <article
      aria-label={`Evidence card from ${sourceName(claim.sourceEngine)}`}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-border bg-bg-raised p-3 shadow-xs transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none",
        selected ? "border-accent shadow-md" : "hover:border-border-strong hover:shadow-sm",
      )}
    >
      <div className="flex items-center gap-2">
        {claim.brandName ? (
          <CardBrand claim={claim} />
        ) : (
          <span className="truncate text-[12px] font-semibold text-fg">{sourceName(claim.sourceEngine)}</span>
        )}
        <span
          className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] text-fg-tertiary"
          title={`${sourceName(claim.sourceEngine)}, fetched ${shortDate(claim.fetchedAt)}`}
        >
          <span
            className="grid size-4 place-items-center rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)` }}
          >
            <PlatformLogo engine={claim.sourceEngine} className="size-3" />
          </span>
        </span>
      </div>
      <CardThumb claim={claim} className="h-[88px]" />
      <p className={cn("text-[13px] font-medium leading-[1.35] text-fg", hasThumb ? (tagsMayWrap(claim) ? "line-clamp-1" : "line-clamp-2") : "line-clamp-3")}>
        {ad ?? displayClaimText(claim.text)}
      </p>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <CardTags claim={claim} />
        {isHttpUrl(claim.evidenceUrl) ? (
          <a
            href={claim.evidenceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="nodrag focus-ring ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-sm text-[12px] font-medium text-fg-secondary hover:text-fg"
          >
            Open source
            <ArrowUpRight {...iconProps} size={13} aria-hidden="true" className="size-3.5" />
          </a>
        ) : null}
      </div>
      <Handles readOnly={readOnly} />
    </article>
  );
}

export function NoteNode({ id, data, selected }: NodeProps) {
  const actions = useContext(CanvasActionsContext);
  const noteId = data.id as string;
  const serverText = data.text as string;
  const color: NoteColor = isNoteColor(data.color as string) ? (data.color as NoteColor) : "amber";
  const [draft, setDraft] = useState(serverText);
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | null>(null);
  const saveRef = useRef(actions.saveNoteText);
  useEffect(() => {
    saveRef.current = actions.saveNoteText;
  });
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const [lastServer, setLastServer] = useState(serverText);
  if (serverText !== lastServer) {
    setLastServer(serverText);
    if (!focused) setDraft(serverText);
  }

  function flush() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pending.current !== null) {
      saveRef.current(noteId, pending.current);
      pending.current = null;
    }
  }
  useEffect(() => flush, []); // eslint-disable-line react-hooks/exhaustive-deps -- flush a pending edit on unmount
  useEffect(() => {
    if (data.autoFocus) areaRef.current?.focus();
  }, [data.autoFocus]);

  function onChange(text: string) {
    setDraft(text);
    pending.current = text;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, NOTE_SAVE_DELAY_MS);
  }

  return (
    <article
      aria-label="Sticky note"
      className={cn(
        "flex h-full w-full flex-col rounded-md border border-border-strong p-2.5 shadow-sm",
        selected && "ring-2 ring-accent/40",
      )}
      style={{ backgroundColor: NOTE_COLOR_CSS[color] }}
    >
      {!actions.readOnly ? (
        <NodeResizer
          isVisible={selected}
          minWidth={MIN_SIZE}
          minHeight={MIN_SIZE}
          onResizeEnd={(_, p) => actions.commitMoves([{ ...fromNodeId(id), x: p.x, y: p.y, w: p.width, h: p.height } as Move])}
        />
      ) : null}
      {actions.readOnly ? (
        <p className="whitespace-pre-wrap break-words text-[13px] leading-5 text-fg">{serverText}</p>
      ) : (
        <textarea
          ref={areaRef}
          value={draft}
          maxLength={MAX_NOTE_TEXT}
          aria-label="Note text"
          placeholder="Write a note"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            flush();
          }}
          className="nodrag nowheel nopan focus-ring min-h-0 w-full flex-1 resize-none rounded-sm bg-transparent text-[13px] leading-5 text-fg placeholder:text-fg-placeholder"
        />
      )}
      {!actions.readOnly && selected ? (
        <div role="group" aria-label="Note colour" className="nodrag mt-1.5 flex gap-1.5">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Colour ${c}`}
              aria-pressed={c === color}
              onClick={() => actions.setNoteColor(noteId, c)}
              className={cn("focus-ring size-4 rounded-full border border-border-strong", c === color && "ring-2 ring-accent")}
              style={{ backgroundColor: NOTE_COLOR_CSS[c] }}
            />
          ))}
        </div>
      ) : null}
      <Handles readOnly={actions.readOnly} />
    </article>
  );
}

export function FrameNode({ id, data, selected }: NodeProps) {
  const actions = useContext(CanvasActionsContext);
  const frameId = data.id as string;
  const title = data.title as string;
  const [draft, setDraft] = useState(title);
  const [lastServer, setLastServer] = useState(title);
  if (title !== lastServer) {
    setLastServer(title);
    setDraft(title);
  }
  function commit() {
    const next = draft.trim();
    if (next === "" || next === title) {
      setDraft(title);
      return;
    }
    actions.saveFrameTitle(frameId, next);
  }
  return (
    <section
      aria-label={`Frame: ${title}`}
      className={cn(
        "h-full w-full rounded-xl border border-border-strong bg-accent/[0.03]",
        selected && "ring-2 ring-accent/40",
      )}
    >
      {!actions.readOnly ? (
        <NodeResizer
          isVisible={selected}
          minWidth={MIN_SIZE * 2}
          minHeight={MIN_SIZE * 2}
          onResizeEnd={(_, p) => actions.commitMoves([{ ...fromNodeId(id), x: p.x, y: p.y, w: p.width, h: p.height } as Move])}
        />
      ) : null}
      {actions.readOnly ? (
        <h2 className="px-3 py-2 text-[13px] font-semibold text-fg-secondary">{title}</h2>
      ) : (
        <input
          value={draft}
          maxLength={MAX_FRAME_TITLE}
          aria-label="Frame title"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="nodrag focus-ring m-2 h-7 w-[calc(100%-1rem)] rounded-sm bg-transparent px-1 text-[13px] font-semibold text-fg-secondary hover:bg-bg-inset/70"
        />
      )}
      <Handles readOnly={actions.readOnly} />
    </section>
  );
}

function facingPoint(node: InternalNode, toward: { x: number; y: number }): { x: number; y: number; position: Position } {
  const { x, y } = node.internals.positionAbsolute;
  const w = node.measured.width ?? 0;
  const h = node.measured.height ?? 0;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (Math.abs(dx) * h > Math.abs(dy) * w) {
    return dx > 0 ? { x: x + w, y: cy, position: Position.Right } : { x, y: cy, position: Position.Left };
  }
  return dy > 0 ? { x: cx, y: y + h, position: Position.Bottom } : { x: cx, y, position: Position.Top };
}

function centreOf(node: InternalNode): { x: number; y: number } {
  const { x, y } = node.internals.positionAbsolute;
  return { x: x + (node.measured.width ?? 0) / 2, y: y + (node.measured.height ?? 0) / 2 };
}

export function LabeledEdge({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data, selected }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const measured = Boolean(sourceNode?.measured.width && targetNode?.measured.width);
  const from = measured && sourceNode && targetNode ? facingPoint(sourceNode, centreOf(targetNode)) : null;
  const to = measured && sourceNode && targetNode ? facingPoint(targetNode, centreOf(sourceNode)) : null;
  const actions = useContext(CanvasActionsContext);
  const label = (data?.label as string | undefined) ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const [path, labelX, labelY] = getBezierPath(
    from && to
      ? { sourceX: from.x, sourceY: from.y, sourcePosition: from.position, targetX: to.x, targetY: to.y, targetPosition: to.position }
      : { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition },
  );

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next !== label) actions.saveEdgeLabel(id, next);
  }

  return (
    <g onDoubleClick={() => !actions.readOnly && (setDraft(label), setEditing(true))}>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        interactionWidth={20}
        style={{ stroke: selected ? "var(--accent)" : "var(--border-strong)", strokeWidth: selected ? 2 : 1.5 }}
      />
      {label !== "" || editing ? (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            className="nodrag nopan pointer-events-auto absolute"
          >
            {editing ? (
              <input
                autoFocus
                value={draft}
                maxLength={MAX_EDGE_LABEL}
                aria-label="Connection label"
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="focus-ring h-6 w-32 rounded-sm border border-border-strong bg-bg-raised px-1.5 text-[11px] text-fg"
              />
            ) : (
              <span className="rounded-sm border border-border bg-bg-raised px-1.5 py-0.5 text-[11px] text-fg-secondary shadow-xs">{label}</span>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </g>
  );
}

export const nodeTypes = { evidence: EvidenceNode, note: NoteNode, frame: FrameNode };
export const edgeTypes = { labeled: LabeledEdge };
