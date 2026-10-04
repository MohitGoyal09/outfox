"use client";


import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { Maximize, Share2, StickyNote, SquareDashed } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { nodesInsideFrame } from "@/convex/lib/canvasModel";
import { Button } from "../Button";
import { Skeleton, SkeletonRegion } from "../Skeleton";
import { iconProps } from "../tokens";
import { BoardSwitcher } from "./BoardSwitcher";
import { CanvasChrome, usePrefersReducedMotion } from "./CanvasChrome";
import { ShareDialog } from "./ShareDialog";
import { buildEdges, buildNodes, fromNodeId, mergeEdges, mergeNodes, nodeBox, type FlowCanvas } from "./canvas-flow";
import { CanvasActionsContext, edgeTypes, nodeTypes, type CanvasActions, type Move } from "./canvas-nodes";
import { useCanvasActions } from "./useCanvasActions";

type FrameDrag = { frameId: string; start: { x: number; y: number }; members: Map<string, { x: number; y: number }> };

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

function CanvasInner({ boardId, canvas, shared }: { boardId: Id<"boards">; canvas: FlowCanvas; shared: boolean }) {
  const actions = useCanvasActions(boardId, canvas);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const reduceMotion = usePrefersReducedMotion();
  const surface = useRef<HTMLDivElement>(null);
  const frameDrag = useRef<FrameDrag | null>(null);

  const [nodes, setNodes] = useState<Node[]>(() => buildNodes(canvas));
  const [edges, setEdges] = useState<Edge[]>(() => buildEdges(canvas));
  const [dragging, setDragging] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [freshNoteId, setFreshNoteId] = useState<string | null>(null);

  const [seen, setSeen] = useState(canvas);
  if (canvas !== seen) {
    setSeen(canvas);
    if (!dragging) {
      setNodes((prev) => mergeNodes(prev, buildNodes(canvas)));
      setEdges((prev) => mergeEdges(prev, buildEdges(canvas)));
    }
  }

  const shownNodes = useMemo(
    () => (freshNoteId ? nodes.map((n) => (n.id === `note:${freshNoteId}` ? { ...n, data: { ...n.data, autoFocus: true } } : n)) : nodes),
    [nodes, freshNoteId],
  );

  const centre = () => {
    const rect = surface.current?.getBoundingClientRect();
    return screenToFlowPosition({ x: (rect?.left ?? 0) + (rect?.width ?? 0) / 2, y: (rect?.top ?? 0) + (rect?.height ?? 0) / 2 });
  };
  const addNote = async () => {
    const id = await actions.addNoteAt(centre());
    if (id) setFreshNoteId(id);
  };
  const addFrame = () => void actions.addFrameAt(centre());
  const fit = () => void fitView({ padding: 0.2, duration: reduceMotion ? 0 : 250 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || shareOpen) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        void addNote();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        addFrame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onNodesChange: OnNodesChange = (changes) => setNodes((prev) => applyNodeChanges(changes, prev));
  const onEdgesChange: OnEdgesChange = (changes) => setEdges((prev) => applyEdgeChanges(changes, prev));

  const toMove = (node: Node, pos = node.position): Move => ({ ...fromNodeId(node.id), x: pos.x, y: pos.y });

  const ctx: CanvasActions = {
    readOnly: false,
    saveNoteText: actions.saveNoteText,
    setNoteColor: actions.setNoteColor,
    saveFrameTitle: actions.saveFrameTitle,
    saveEdgeLabel: actions.saveEdgeLabel,
    commitMoves: actions.commitMoves,
  };

  return (
    <CanvasActionsContext.Provider value={ctx}>
      <div ref={surface} className="h-full min-h-[320px] w-full">
        <ReactFlow
          nodes={shownNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={actions.connect}
          deleteKeyCode={["Backspace", "Delete"]}
          onNodeDragStart={(_, node) => {
            setDragging(true);
            if (node.type !== "frame") return;
            const inside = nodesInsideFrame(nodeBox(node), nodes.map(nodeBox));
            const members = new Map(nodes.filter((n) => inside.includes(n.id)).map((n) => [n.id, { ...n.position }]));
            frameDrag.current = { frameId: node.id, start: { ...node.position }, members };
          }}
          onNodeDrag={(_, node) => {
            const drag = frameDrag.current;
            if (!drag || drag.frameId !== node.id) return;
            const dx = node.position.x - drag.start.x;
            const dy = node.position.y - drag.start.y;
            setNodes((prev) =>
              prev.map((n) => {
                const from = drag.members.get(n.id);
                return from ? { ...n, position: { x: from.x + dx, y: from.y + dy } } : n;
              }),
            );
          }}
          onNodeDragStop={(_, node, dragged) => {
            const drag = frameDrag.current;
            frameDrag.current = null;
            const moves = new Map(dragged.map((n) => [n.id, toMove(n)]));
            if (drag && drag.frameId === node.id) {
              const dx = node.position.x - drag.start.x;
              const dy = node.position.y - drag.start.y;
              drag.members.forEach((from, id) => {
                if (!moves.has(id)) moves.set(id, { ...fromNodeId(id), x: from.x + dx, y: from.y + dy });
              });
            }
            setDragging(false);
            actions.commitMoves([...moves.values()]);
          }}
          onDelete={({ nodes: gone, edges: goneEdges }) => actions.deleteMany(gone.map((n) => n.id), goneEdges.map((e) => e.id))}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
      style={{ width: "100%", height: "100%" }}
          aria-label="Board canvas"
        >
          <CanvasChrome />
          <Panel position="top-left">
            <div role="toolbar" aria-label="Canvas tools" className="flex items-center gap-1 rounded-md border border-border bg-bg-raised p-1 shadow-sm">
              <BoardSwitcher boardId={boardId} name={canvas.name} />
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
              <Button variant="ghost" size="sm" aria-keyshortcuts="N" onClick={() => void addNote()} icon={<StickyNote {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}>
                Add note
              </Button>
              <Button variant="ghost" size="sm" aria-keyshortcuts="F" onClick={addFrame} icon={<SquareDashed {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}>
                Add frame
              </Button>
              <Button variant="ghost" size="sm" onClick={fit} icon={<Maximize {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}>
                Fit view
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)} icon={<Share2 {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}>
                {shared ? "Shared" : "Share"}
              </Button>
            </div>
          </Panel>
          {nodes.every((n) => n.type === "frame") ? (
            <Panel position="bottom-center" className="pointer-events-none !mb-6">
              <p className="rounded-md border border-border bg-bg-raised px-3 py-2 text-[13px] text-fg-secondary shadow-xs">
                Nothing on this board yet. Use the save button on any evidence card or chat source, then drop it into a column. Press N for a note or F for a frame.
              </p>
            </Panel>
          ) : null}
        </ReactFlow>
      </div>
      <ShareDialog boardId={boardId} shared={shared} open={shareOpen} onOpenChange={setShareOpen} />
    </CanvasActionsContext.Provider>
  );
}

export function useFlowCanvas(boardId: Id<"boards">, skip = false): { canvas: FlowCanvas; shared: boolean } | undefined {
  const data = useQuery(api.boardCanvas.getCanvas, skip ? "skip" : { boardId });
  return useMemo(
    () =>
      data
        ? {
            shared: data.board.shared,
            canvas: {
              name: data.board.name,
              items: data.items.map((i) => ({
                id: i._id,
                x: i.x,
                y: i.y,
                claim: i.claim
                  ? { text: i.claim.text, sourceEngine: i.claim.sourceEngine, evidenceUrl: i.claim.evidenceUrl, fetchedAt: i.claim.fetchedAt, claimId: i.claim._id }
                  : null,
              })),
              notes: data.notes.map((n) => ({ id: n._id, text: n.text, color: n.color, x: n.x, y: n.y, w: n.w, h: n.h })),
              frames: data.frames.map((f) => ({ id: f._id, title: f.title, x: f.x, y: f.y, w: f.w, h: f.h })),
              edges: data.edges.map((e) => ({ id: e._id, source: e.source, target: e.target, label: e.label })),
            },
          }
        : undefined,
    [data],
  );
}

export function BoardCanvas({ boardId }: { boardId: Id<"boards"> }) {
  const flow = useFlowCanvas(boardId);
  if (!flow) {
    return (
      <SkeletonRegion label="Loading the board" className="grid h-full place-items-center">
        <Skeleton variant="block" height={160} width={280} />
      </SkeletonRegion>
    );
  }
  return (
    <ReactFlowProvider>
      <CanvasInner boardId={boardId} canvas={flow.canvas} shared={flow.shared} />
    </ReactFlowProvider>
  );
}
