import type { Claim, ClaimSource, Relation, Source } from "@/lib/validation/schemas";

export type LinkedSource = Source & { relation: Relation; relation_note: string };

export type EvidenceColumns = Record<Relation, LinkedSource[]>;

export function linkedSourcesForClaim(
  claimId: string,
  links: readonly ClaimSource[],
  sources: readonly Source[],
): LinkedSource[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  return links.flatMap((link) => {
    if (link.claim_id !== claimId) return [];
    const source = sourceById.get(link.source_id);
    return source
      ? [{ ...source, relation: link.relation, relation_note: link.relation_note }]
      : [];
  });
}

export function groupByRelation(sources: readonly LinkedSource[]): EvidenceColumns {
  const columns: EvidenceColumns = { supports: [], contradicts: [], context: [] };
  for (const source of sources) columns[source.relation].push(source);
  return columns;
}

export type ClaimTally = Record<Relation, number>;

export function tallyClaims(
  claims: readonly Claim[],
  links: readonly ClaimSource[],
): Map<string, ClaimTally> {
  const tallies = new Map<string, ClaimTally>(
    claims.map((claim) => [claim.id, { supports: 0, contradicts: 0, context: 0 }]),
  );
  for (const link of links) {
    const tally = tallies.get(link.claim_id);
    if (tally) tally[link.relation] += 1;
  }
  return tallies;
}

export function sourcesNotLinkedTo(
  claimId: string,
  links: readonly ClaimSource[],
  sources: readonly Source[],
): Source[] {
  const linked = new Set(links.filter((link) => link.claim_id === claimId).map((l) => l.source_id));
  return sources.filter((source) => !linked.has(source.id));
}
