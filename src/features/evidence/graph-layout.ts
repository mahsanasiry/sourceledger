import type { Claim, ClaimSource, Relation, Source } from "@/lib/validation/schemas";

export const ROW_GAP = 76;
export const COLUMN_GAP = 380;
export const ROWS_PER_COLUMN = 24;

export type GraphNodeData =
  | { kind: "claim"; entityId: string; label: string; status: Claim["status"] }
  | {
      kind: "source";
      entityId: string;
      label: string;
      review: Source["review_status"];
      flagged: boolean;
    };

export type GraphNode = { id: string; x: number; y: number; data: GraphNodeData };
export type GraphEdge = { id: string; from: string; to: string; relation: Relation };
export type GraphLayout = { nodes: GraphNode[]; edges: GraphEdge[] };

export type GraphFilter = {
  claimId: string | null;
  relation: Relation | null;
};

export const claimNodeId = (id: string) => `claim:${id}`;
export const sourceNodeId = (id: string) => `source:${id}`;

export function buildGraphLayout(
  claims: readonly Claim[],
  sources: readonly Source[],
  links: readonly ClaimSource[],
  filter: GraphFilter,
): GraphLayout {
  const visibleLinks = links.filter(
    (link) =>
      (!filter.claimId || link.claim_id === filter.claimId) &&
      (!filter.relation || link.relation === filter.relation),
  );

  const filtering = Boolean(filter.claimId || filter.relation);
  const linkedSourceIds = new Set(visibleLinks.map((link) => link.source_id));
  const visibleClaims = claims.filter((claim) =>
    filter.claimId ? claim.id === filter.claimId : true,
  );
  const visibleSources = sources.filter((source) => !filtering || linkedSourceIds.has(source.id));

  const claimIndex = new Map(visibleClaims.map((claim, index) => [claim.id, index]));

  const barycenter = (sourceId: string): number => {
    const indices = visibleLinks
      .filter((link) => link.source_id === sourceId)
      .map((link) => claimIndex.get(link.claim_id))
      .filter((index): index is number => index !== undefined);
    if (indices.length === 0) return Number.MAX_SAFE_INTEGER;
    return indices.reduce((sum, index) => sum + index, 0) / indices.length;
  };

  const orderedSources = visibleSources
    .map((source) => ({ source, weight: barycenter(source.id) }))
    .sort((a, b) => a.weight - b.weight || a.source.title.localeCompare(b.source.title))
    .map((entry) => entry.source);

  const rowsInFirstColumn = Math.max(1, Math.min(orderedSources.length, ROWS_PER_COLUMN));
  const columnHeight = rowsInFirstColumn * ROW_GAP;
  const claimSpacing = Math.max(ROW_GAP, columnHeight / Math.max(1, visibleClaims.length));

  const nodes: GraphNode[] = [
    ...visibleClaims.map<GraphNode>((claim, index) => ({
      id: claimNodeId(claim.id),
      x: 0,
      y: index * claimSpacing,
      data: { kind: "claim", entityId: claim.id, label: claim.statement, status: claim.status },
    })),
    ...orderedSources.map<GraphNode>((source, index) => ({
      id: sourceNodeId(source.id),
      x: COLUMN_GAP * (1 + Math.floor(index / ROWS_PER_COLUMN)),
      y: (index % ROWS_PER_COLUMN) * ROW_GAP,
      data: {
        kind: "source",
        entityId: source.id,
        label: source.title,
        review: source.review_status,
        flagged: source.flagged,
      },
    })),
  ];

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: GraphEdge[] = visibleLinks
    .filter(
      (link) =>
        nodeIds.has(claimNodeId(link.claim_id)) && nodeIds.has(sourceNodeId(link.source_id)),
    )
    .map((link) => ({
      id: `${link.claim_id}:${link.source_id}`,
      from: claimNodeId(link.claim_id),
      to: sourceNodeId(link.source_id),
      relation: link.relation,
    }));

  return { nodes, edges };
}
