
export type NodeKind = "item" | "note" | "frame";
export type NodeRef = { kind: NodeKind; id: string };

export const MAX_NOTES_PER_BOARD = 200;
export const MAX_FRAMES_PER_BOARD = 50;
export const MAX_MOVES_PER_CALL = 200;
export const MAX_EDGE_LABEL = 80;

export const NOTE_COLORS = ["stone", "amber", "green", "rose", "blue"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];
export const DEFAULT_NOTE_COLOR: NoteColor = "amber";

export const NOTE_COLOR_CSS: Record<NoteColor, string> = {
  stone: "var(--bg-inset)",
  amber: "color-mix(in srgb, var(--cat-4) 16%, #ffffff)",
  green: "color-mix(in srgb, var(--cat-3) 14%, #ffffff)",
  rose: "color-mix(in srgb, var(--cat-5) 12%, #ffffff)",
  blue: "color-mix(in srgb, var(--cat-2) 14%, #ffffff)",
};

export const ITEM_W = 280;
export const ITEM_H = 200;
export const NOTE_H = 160;
export const FRAME_W = 520;
export const MIN_SIZE = 80;
export const MAX_COORD = 100000;

const GRID_COLS = 4;

export function isNoteColor(value: string): value is NoteColor {
  return (NOTE_COLORS as readonly string[]).includes(value);
}

export function placeItems<T extends { x?: number; y?: number }>(items: readonly T[]): (T & { x: number; y: number })[] {
  return items.map((item, index) =>
    item.x !== undefined && item.y !== undefined
      ? { ...item, x: item.x, y: item.y }
      : { ...item, ...defaultGridPosition(index) },
  );
}

export type EdgeCheck = { ok: true } | { ok: false; reason: string };

export function validateNewEdge(input: {
  source: NodeRef;
  target: NodeRef;
  existing: readonly { source: NodeRef; target: NodeRef }[];
  exists: (ref: NodeRef) => boolean;
}): EdgeCheck {
  if (!exists(source) || !exists(target)) return { ok: false, reason: "Both ends must be on this board." };
  const key = `${nodeKey(source)}>${nodeKey(target)}`;
  if (existing.some((edge) => `${nodeKey(edge.source)}>${nodeKey(edge.target)}` === key)) {
    return { ok: false, reason: "These two are already connected." };
  }
  return { ok: true };
}

type Box = { x: number; y: number; w: number; h: number };

export function nodesInsideFrame(
  frame: Box & { key: string },
  nodes: readonly (Box & { key: string })[],
): string[] {
  return nodes
    .filter((node) => node.key !== frame.key)
    .filter((node) => {
      const cx = node.x + node.w / 2;
    })
    .map((node) => node.key);
}

export function sanitizeMove(move: { x: number; y: number; w?: number; h?: number }): {
  x: number;
  y: number;
  w?: number;
  h?: number;
} | null {
  if (values.some((value) => value !== undefined && !Number.isFinite(value))) return null;
}

export function staggeredPosition(base: { x: number; y: number }, count: number): { x: number; y: number } {
  const step = (Math.max(0, count) % 8) * 24;
  return { x: base.x + step, y: base.y + step };
}

const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function toBase64Url(bytes: Uint8Array): string {
  for (let i = 0; i < bytes.length; i += 3) {
    if (i + 2 < bytes.length) out += B64URL[n & 63];
  }
  return out;
}

export const SHARE_TOKEN_BYTES = 24;
export const SHARE_TOKEN_MAX_LENGTH = 64;

export function looksLikeShareToken(token: string): boolean {
  return (
    token.length >= SHARE_TOKEN_MIN_LENGTH &&
    token.length <= SHARE_TOKEN_MAX_LENGTH &&
    /^[A-Za-z0-9_-]+$/.test(token)
  );
}
