"use client";


import { useCallback } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import type { Connection } from "@xyflow/react";
import type { OptimisticLocalStore } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { FRAME_H, FRAME_W, NOTE_H, NOTE_W, staggeredPosition, type NodeRef } from "@/convex/lib/canvasModel";
import { fromNodeId, toNodeId, type FlowCanvas } from "./canvas-flow";
import type { Move } from "./canvas-nodes";

const UNDO_WINDOW_MS = 5000;

export function errorMessage(error: unknown): string {
  if (error instanceof ConvexError && typeof error.data === "string") return error.data;
  return "Something went wrong. Try again.";
}

type Canvas = FunctionReturnType<typeof api.boardCanvas.getCanvas>;

const touches = (ref: NodeRef, node: NodeRef) => ref.kind === node.kind && ref.id === node.id;

function withoutNode(cur: Canvas, node: NodeRef): Canvas {
  return {
    ...cur,
    items: cur.items.filter((r) => !(node.kind === "item" && r._id === node.id)),
    notes: cur.notes.filter((r) => !(node.kind === "note" && r._id === node.id)),
    frames: cur.frames.filter((r) => !(node.kind === "frame" && r._id === node.id)),
    edges: cur.edges.filter((e) => !touches(e.source, node) && !touches(e.target, node)),
  };
}

export function useCanvasActions(boardId: Id<"boards">, canvas: FlowCanvas) {
  const moveNodes = useMutation(api.boardCanvas.moveNodes).withOptimisticUpdate((store, args) => {
    const cur = store.getQuery(api.boardCanvas.getCanvas, { boardId: args.boardId });
    if (!cur) return;
    const by = new Map(args.moves.map((m) => [`${m.kind}:${m.id}`, m]));
    const apply = <T extends { _id: string; x: number; y: number }>(kind: string, rows: T[], sized: boolean): T[] =>
      rows.map((r) => {
        const m = by.get(`${kind}:${r._id}`);
        if (!m) return r;
        return { ...r, x: m.x, y: m.y, ...(sized && m.w !== undefined ? { w: m.w } : {}), ...(sized && m.h !== undefined ? { h: m.h } : {}) };
      });
    store.setQuery(api.boardCanvas.getCanvas, { boardId: args.boardId }, {
      ...cur,
      items: apply("item", cur.items, false),
      notes: apply("note", cur.notes, true),
      frames: apply("frame", cur.frames, true),
    });
  });
  const optimisticDelete = (kind: "note" | "frame" | "item") => (store: OptimisticLocalStore, id: string) => {
    const cur = store.getQuery(api.boardCanvas.getCanvas, { boardId });
    if (cur) store.setQuery(api.boardCanvas.getCanvas, { boardId }, withoutNode(cur, { kind, id }));
  };
  const deleteNote = useMutation(api.boardCanvas.deleteNote).withOptimisticUpdate((s, a) => optimisticDelete("note")(s, a.noteId));
  const deleteFrame = useMutation(api.boardCanvas.deleteFrame).withOptimisticUpdate((s, a) => optimisticDelete("frame")(s, a.frameId));
  const removeItem = useMutation(api.boards.removeItem).withOptimisticUpdate((s, a) => optimisticDelete("item")(s, a.itemId));
  const deleteEdge = useMutation(api.boardCanvas.deleteEdge).withOptimisticUpdate((store, a) => {
    const cur = store.getQuery(api.boardCanvas.getCanvas, { boardId });
    if (cur) store.setQuery(api.boardCanvas.getCanvas, { boardId }, { ...cur, edges: cur.edges.filter((e) => e._id !== a.edgeId) });
  });
  const createNote = useMutation(api.boardCanvas.createNote);
  const createFrame = useMutation(api.boardCanvas.createFrame);
  const createEdge = useMutation(api.boardCanvas.createEdge);
  const updateNote = useMutation(api.boardCanvas.updateNote);
  const updateFrame = useMutation(api.boardCanvas.updateFrame);
  const updateEdge = useMutation(api.boardCanvas.updateEdge);
  const addItem = useMutation(api.boards.addItem);

  const run = useCallback(async (work: () => Promise<unknown>, failure?: string) => {
    try {
      await work();
      return true;
    } catch (error) {
      toast.error(failure ?? errorMessage(error));
      return false;
    }
  }, []);

  const commitMoves = useCallback(
    (moves: Move[]) => {
      if (moves.length === 0) return;
      void run(() => moveNodes({ boardId, moves }), "Could not save the new positions. Try again.");
    },
    [boardId, moveNodes, run],
  );

  const saveNoteText = (id: string, text: string) =>
    void run(() => updateNote({ noteId: id as Id<"boardNotes">, text }), "Could not save your note. Try again.");
  const setNoteColor = (id: string, color: string) => void run(() => updateNote({ noteId: id as Id<"boardNotes">, color }));
  const saveFrameTitle = (id: string, title: string) => void run(() => updateFrame({ frameId: id as Id<"boardFrames">, title }));
  const saveEdgeLabel = (id: string, label: string) => void run(() => updateEdge({ edgeId: id as Id<"boardEdges">, label }));

  const addNoteAt = async (base: { x: number; y: number }): Promise<string | null> => {
    const at = staggeredPosition({ x: base.x - NOTE_W / 2, y: base.y - NOTE_H / 2 }, canvas.notes.length);
    try {
      return await createNote({ boardId, ...at });
    } catch (error) {
      toast.error(errorMessage(error));
      return null;
    }
  };
  const addFrameAt = async (base: { x: number; y: number }) => {
    const at = staggeredPosition({ x: base.x - FRAME_W / 2, y: base.y - FRAME_H / 2 }, canvas.frames.length);
    await run(() => createFrame({ boardId, ...at }));
  };

  const connect = (c: Connection) => {
    if (!c.source || !c.target) return;
    void run(() => createEdge({ boardId, source: fromNodeId(c.source), target: fromNodeId(c.target) }));
  };

  const deleteMany = (nodeIds: string[], edgeIds: string[]) => {
    const nodes = nodeIds.map(fromNodeId);
    const gone = new Set(nodeIds);
    const touching = canvas.edges.filter((e) => gone.has(toNodeId(e.source)) || gone.has(toNodeId(e.target)));
    const loose = canvas.edges.filter((e) => edgeIds.includes(e.id) && !touching.includes(e));
    const snapshot = {
      notes: canvas.notes.filter((n) => gone.has(toNodeId({ kind: "note", id: n.id }))),
      frames: canvas.frames.filter((f) => gone.has(toNodeId({ kind: "frame", id: f.id }))),
      items: canvas.items.filter((i) => gone.has(toNodeId({ kind: "item", id: i.id })) && i.claim?.claimId),
      edges: [...touching, ...loose],
    };

    void run(async () => {
      for (const e of loose) await deleteEdge({ edgeId: e.id as Id<"boardEdges"> });
      for (const n of nodes) {
        if (n.kind === "note") await deleteNote({ noteId: n.id as Id<"boardNotes"> });
        else if (n.kind === "frame") await deleteFrame({ frameId: n.id as Id<"boardFrames"> });
        else await removeItem({ itemId: n.id as Id<"boardItems"> });
      }
    }, "Could not delete that. Try again.").then((ok) => {
      if (!ok) return;
      const restorable = snapshot.notes.length + snapshot.frames.length + snapshot.items.length + snapshot.edges.length > 0;
      toast("Deleted.", {
        duration: UNDO_WINDOW_MS,
        action: restorable ? { label: "Undo", onClick: () => void restore(snapshot) } : undefined,
      });
    });
  };

  async function restore(s: { notes: FlowCanvas["notes"]; frames: FlowCanvas["frames"]; items: FlowCanvas["items"]; edges: FlowCanvas["edges"] }) {
    const remap = new Map<string, string>();
    const ok = await run(async () => {
      for (const f of s.frames) {
        const id = await createFrame({ boardId, x: f.x, y: f.y, w: f.w, h: f.h, title: f.title });
        remap.set(toNodeId({ kind: "frame", id: f.id }), toNodeId({ kind: "frame", id }));
      }
      for (const n of s.notes) {
        const id = await createNote({ boardId, x: n.x, y: n.y, w: n.w, h: n.h, text: n.text, color: n.color });
        remap.set(toNodeId({ kind: "note", id: n.id }), toNodeId({ kind: "note", id }));
      }
      for (const i of s.items) {
        const id = await addItem({ boardId, claimId: i.claim!.claimId as Id<"claims"> });
        await moveNodes({ boardId, moves: [{ kind: "item", id, x: i.x, y: i.y }] });
        remap.set(toNodeId({ kind: "item", id: i.id }), toNodeId({ kind: "item", id }));
      }
      for (const e of s.edges) {
        const source = fromNodeId(remap.get(toNodeId(e.source)) ?? toNodeId(e.source));
        const target = fromNodeId(remap.get(toNodeId(e.target)) ?? toNodeId(e.target));
        try {
          await createEdge({ boardId, source, target, label: e.label });
        } catch {
        }
      }
    }, "Could not undo that. Try again.");
    if (ok) toast.success("Restored.");
  }

  return { commitMoves, saveNoteText, setNoteColor, saveFrameTitle, saveEdgeLabel, addNoteAt, addFrameAt, connect, deleteMany };
}
