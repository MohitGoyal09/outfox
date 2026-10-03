import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { FRAME_H, FRAME_W, ITEM_W, NOTE_H, NOTE_W, type NodeKind, type NodeRef } from "@/convex/lib/canvasModel";

export type FlowClaim = {
  text: string;
  sourceEngine: string;
  evidenceUrl: string;
  fetchedAt: string;
  claimId?: string;
};
export type FlowItem = { id: string; x: number; y: number; claim: FlowClaim | null };
export type FlowNote = { id: string; text: string; color: string; x: number; y: number; w: number; h: number };
export type FlowFrame = { id: string; title: string; x: number; y: number; w: number; h: number };
export type FlowEdge = { id: string; source: NodeRef; target: NodeRef; label?: string };
export type FlowCanvas = {
  name: string;
  items: FlowItem[];
  notes: FlowNote[];
  frames: FlowFrame[];
  edges: FlowEdge[];
};

export const toNodeId = (ref: NodeRef): string => `${ref.kind}:${ref.id}`;
export function fromNodeId(nodeId: string): NodeRef {
  const at = nodeId.indexOf(":");
  return { kind: nodeId.slice(0, at) as NodeKind, id: nodeId.slice(at + 1) };
}

export type CanvasNodeData = Record<string, unknown>;

export function buildNodes(canvas: FlowCanvas): Node[] {
  const frames: Node[] = canvas.frames.map((f) => ({
    id: toNodeId({ kind: "frame", id: f.id }),
    type: "frame",
    position: { x: f.x, y: f.y },
    width: f.w,
    height: f.h,
    zIndex: -1,
    data: { id: f.id, title: f.title },
  }));
  const notes: Node[] = canvas.notes.map((n) => ({
    id: toNodeId({ kind: "note", id: n.id }),
    type: "note",
    position: { x: n.x, y: n.y },
    width: n.w || NOTE_W,
    height: n.h || NOTE_H,
    data: { id: n.id, text: n.text, color: n.color, autoFocus: false },
  }));
  const items: Node[] = canvas.items.map((i) => ({
    id: toNodeId({ kind: "item", id: i.id }),
    type: "evidence",
    position: { x: i.x, y: i.y },
    style: { width: ITEM_W },
    data: { id: i.id, claim: i.claim },
  }));
  return [...frames, ...items, ...notes];
}

export function buildEdges(canvas: FlowCanvas): Edge[] {
  return canvas.edges.map((e) => ({
    id: e.id,
    type: "labeled",
    source: toNodeId(e.source),
    target: toNodeId(e.target),
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
    data: { label: e.label ?? "" },
  }));
}

export function nodeBox(node: Node): { key: string; x: number; y: number; w: number; h: number } {
  const fallback = node.type === "frame" ? [FRAME_W, FRAME_H] : node.type === "note" ? [NOTE_W, NOTE_H] : [ITEM_W, 160];
  return {
    key: node.id,
    x: node.position.x,
    y: node.position.y,
    w: node.measured?.width ?? node.width ?? fallback[0],
    h: node.measured?.height ?? node.height ?? fallback[1],
  };
}

export function mergeNodes(prev: readonly Node[], next: readonly Node[]): Node[] {
  const old = new Map(prev.map((n) => [n.id, n]));
  return next.map((n) => {
    const o = old.get(n.id);
    return o ? { ...n, selected: o.selected, measured: o.measured } : n;
  });
}

export function mergeEdges(prev: readonly Edge[], next: readonly Edge[]): Edge[] {
  const old = new Map(prev.map((e) => [e.id, e]));
  return next.map((e) => ({ ...e, selected: old.get(e.id)?.selected }));
}
