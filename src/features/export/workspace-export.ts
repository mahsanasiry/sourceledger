import type {
  Activity,
  Claim,
  ClaimSource,
  Source,
  Workspace,
} from "@/lib/validation/schemas";
import { toCsv } from "./csv";

export type WorkspaceSnapshot = {
  workspace: Workspace;
  claims: Claim[];
  sources: Source[];
  links: ClaimSource[];
  activity: Activity[];
};

export function buildJsonExport(snapshot: WorkspaceSnapshot, exportedAt: Date): string {
  return JSON.stringify({ exported_at: exportedAt.toISOString(), ...snapshot }, null, 2);
}

export function buildCsvExport(snapshot: WorkspaceSnapshot): string {
  const claimById = new Map(snapshot.claims.map((claim) => [claim.id, claim]));
  const sourceById = new Map(snapshot.sources.map((source) => [source.id, source]));

  const rows = snapshot.links.flatMap((link) => {
    const claim = claimById.get(link.claim_id);
    const source = sourceById.get(link.source_id);
    if (!claim || !source) return [];
    return [
      [
        claim.statement,
        claim.status,
        link.relation,
        source.title,
        source.url,
        source.published_on,
        source.source_type,
        source.review_status,
        source.flagged ? "yes" : "no",
        source.excerpt,
        source.note,
        link.relation_note,
      ],
    ];
  });

  const linkedSourceIds = new Set(snapshot.links.map((link) => link.source_id));
  const unlinked = snapshot.sources
    .filter((source) => !linkedSourceIds.has(source.id))
    .map((source) => [
      "",
      "",
      "",
      source.title,
      source.url,
      source.published_on,
      source.source_type,
      source.review_status,
      source.flagged ? "yes" : "no",
      source.excerpt,
      source.note,
      "",
    ]);

  return toCsv(
    [
      "claim",
      "claim_status",
      "relation",
      "source_title",
      "source_url",
      "published_on",
      "source_type",
      "review_status",
      "flagged",
      "excerpt",
      "source_note",
      "relation_note",
    ],
    [...rows, ...unlinked],
  );
}

export function exportFileName(workspaceName: string, extension: "json" | "csv", at: Date): string {
  const slug =
    workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace";
  return `${slug}-${at.toISOString().slice(0, 10)}.${extension}`;
}
