import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { MAX_EDGES_PER_BOARD, type NodeRef } from "./canvasModel";

export async function deleteEdgesTouching(ctx: MutationCtx, boardId: Id<"boards">, node: NodeRef): Promise<void> {
  const edges = await ctx.db.query("boardEdges").withIndex("by_board", (q) => q.eq("boardId", boardId)).take(MAX_EDGES_PER_BOARD);
  for (const edge of edges) {
    if (touches) await ctx.db.delete(edge._id);
  }
}
