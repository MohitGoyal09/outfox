"use client";


import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ReactFlow, ReactFlowProvider, Panel, useReactFlow } from "@xyflow/react";
import { Maximize } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/convex/_generated/api";
import { Button } from "../Button";
import { iconProps } from "../tokens";
import { BoardCanvasList } from "./BoardCanvasList";
import { CanvasChrome, usePrefersReducedMotion } from "./CanvasChrome";
import { buildEdges, buildNodes, type FlowCanvas } from "./canvas-flow";
import { CanvasActionsContext, edgeTypes, nodeTypes } from "./canvas-nodes";

const READ_ONLY_ACTIONS = {
  readOnly: true,
  saveNoteText: () => {},
  setNoteColor: () => {},
  saveFrameTitle: () => {},
  saveEdgeLabel: () => {},
  commitMoves: () => {},
};

function FitViewButton() {
  const { fitView } = useReactFlow();
  const reduce = usePrefersReducedMotion();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void fitView({ padding: 0.2, duration: reduce ? 0 : 250 })}
      icon={<Maximize {...iconProps} size={14} aria-hidden="true" className="size-3.5" />}
    >
      Fit view
    </Button>
  );
}

function SharedFlow({ canvas }: { canvas: FlowCanvas }) {
  const nodes = useMemo(() => buildNodes(canvas), [canvas]);
  const edges = useMemo(() => buildEdges(canvas), [canvas]);
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      style={{ width: "100%", height: "100%" }}
      aria-label="Shared board canvas"
    >
      <CanvasChrome />
      <Panel position="top-left">
        <div role="toolbar" aria-label="Canvas tools" className="rounded-md border border-border bg-bg-raised p-1 shadow-sm">
          <FitViewButton />
        </div>
      </Panel>
    </ReactFlow>
  );
}

export function SharedBoardView({ token }: { token: string }) {
  const data = useQuery(api.boardCanvas.getSharedCanvas, { token });
  const isPhone = useIsMobile();
  const canvas = useMemo<FlowCanvas | null>(
    () =>
      data
        ? {
            name: data.board.name,
            items: data.items.map((i) => ({ id: i.id, x: i.x, y: i.y, claim: i.claim ? { ...i.claim, tagHook: i.claim.hookType, tagStage: i.claim.funnelStage } : null })),
            notes: data.notes,
            frames: data.frames,
            edges: data.edges,
          }
        : null,
    [data],
  );

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-bg-raised px-4">
        <span className="text-[13px] font-semibold">Outfox · shared board</span>
        {canvas ? <h1 className="truncate text-[13px] text-fg-secondary">{canvas.name}</h1> : null}
        <Link href="/" className="focus-ring ml-auto rounded-sm text-[12px] font-medium text-fg-secondary hover:text-fg">
          Made with Outfox
        </Link>
      </header>
      <main className="min-h-0 flex-1">
        {data === undefined ? (
          <p className="p-6 text-[13px] text-fg-secondary" role="status">Loading the board…</p>
        ) : canvas === null ? (
          <div className="mx-auto max-w-md p-8 text-center">
            <h1 className="type-title text-fg">This board is not shared.</h1>
            <p className="mt-2 text-[13px] text-fg-secondary">The link may be wrong, or the owner turned sharing off.</p>
          </div>
        ) : isPhone ? (
          <div className="h-full overflow-y-auto p-4"><BoardCanvasList canvas={canvas} /></div>
        ) : (
          <CanvasActionsContext.Provider value={READ_ONLY_ACTIONS}>
            <ReactFlowProvider>
              <SharedFlow canvas={canvas} />
            </ReactFlowProvider>
          </CanvasActionsContext.Provider>
        )}
      </main>
    </div>
  );
}
