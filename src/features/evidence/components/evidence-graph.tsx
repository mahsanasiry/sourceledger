"use client";

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { memo, useMemo } from "react";
import { ClaimStatusBadge, FlagBadge, ReviewBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Relation } from "@/lib/validation/schemas";
import { buildGraphLayout, type GraphFilter, type GraphNodeData } from "../graph-layout";
import type { Claim, ClaimSource, Source } from "@/lib/validation/schemas";

const LARGE_GRAPH = 80;

export const EDGE_STYLES: Record<Relation, { stroke: string; strokeDasharray?: string }> = {
  supports: { stroke: "var(--support)" },
  contradicts: { stroke: "var(--contradict)", strokeDasharray: "8 4" },
  context: { stroke: "var(--context)", strokeDasharray: "2 4" },
};

type GraphFlowNode = Node<GraphNodeData>;

const GraphNodeView = memo(function GraphNodeView({ data, selected }: NodeProps<GraphFlowNode>) {
  const isClaim = data.kind === "claim";
  return (
    <div
      className={cn(
        "bg-surface w-64 rounded-lg border-2 px-3 py-2 text-left text-xs shadow-sm",
        isClaim ? "border-accent" : "border-line",
        selected ? "ring-focus ring-2" : "",
      )}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} className="opacity-0" />
      <p className="text-ink-muted mb-0.5 font-semibold tracking-wide uppercase">
        {isClaim ? "Claim" : "Source"}
      </p>
      <p className="line-clamp-2 text-sm leading-snug font-medium">{data.label}</p>
      <p className="mt-1.5 flex flex-wrap gap-1.5">
        {data.kind === "claim" ? <ClaimStatusBadge status={data.status} /> : null}
        {data.kind === "source" ? <ReviewBadge status={data.review} /> : null}
        {data.kind === "source" && data.flagged ? <FlagBadge /> : null}
      </p>
      <Handle type="source" position={Position.Right} isConnectable={false} className="opacity-0" />
    </div>
  );
});

const NODE_TYPES = { entity: GraphNodeView };

type EvidenceGraphProps = {
  claims: Claim[];
  sources: Source[];
  links: ClaimSource[];
  filter: GraphFilter;
  selectedSourceId: string | null;
  onSelectSource: (sourceId: string) => void;
  onSelectClaim: (claimId: string) => void;
};

export function EvidenceGraph({
  claims,
  sources,
  links,
  filter,
  selectedSourceId,
  onSelectSource,
  onSelectClaim,
}: EvidenceGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const layout = buildGraphLayout(claims, sources, links, filter);
    const flowNodes: GraphFlowNode[] = layout.nodes.map((node) => ({
      id: node.id,
      type: "entity",
      position: { x: node.x, y: node.y },
      data: node.data,
      selected: node.data.kind === "source" && node.data.entityId === selectedSourceId,
      draggable: false,
      connectable: false,
      ariaLabel:
        node.data.kind === "claim" ? `Claim: ${node.data.label}` : `Source: ${node.data.label}`,
    }));
    const flowEdges: Edge[] = layout.edges.map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      style: { ...EDGE_STYLES[edge.relation], strokeWidth: 2 },
      ariaLabel: edge.relation,
    }));
    return { nodes: flowNodes, edges: flowEdges };
  }, [claims, sources, links, filter, selectedSourceId]);

  return (
    <div className="border-line bg-surface h-[70vh] min-h-96 rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodeClick={(_event, node) => {
          if (node.data.kind === "source") onSelectSource(node.data.entityId);
          else onSelectClaim(node.data.entityId);
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onlyRenderVisibleElements
        minZoom={0.05}
        maxZoom={1.5}
        fitView
        aria-label="Evidence graph"
      >
        <Background />
        <Controls showInteractive={false} />
        {nodes.length > LARGE_GRAPH ? <MiniMap pannable zoomable /> : null}
      </ReactFlow>
    </div>
  );
}
