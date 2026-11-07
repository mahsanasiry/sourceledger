"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { RELATION_LABELS } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useClaims, useLinks } from "@/features/claims/hooks";
import { SourceDetailPanel } from "@/features/sources/components/source-detail-panel";
import { useSources } from "@/features/sources/hooks";
import { applyParamPatch } from "@/lib/utils/search-params";
import { RELATIONS, type Relation } from "@/lib/validation/schemas";
import { EDGE_STYLES, EvidenceGraph } from "./evidence-graph";

function LegendLine({ relation }: { relation: Relation }) {
  const style = EDGE_STYLES[relation];
  return (
    <svg width="32" height="8" aria-hidden="true">
      <line
        x1="0"
        y1="4"
        x2="32"
        y2="4"
        stroke={style.stroke}
        strokeWidth="2"
        strokeDasharray={style.strokeDasharray}
      />
    </svg>
  );
}

export function GraphView({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const claims = useClaims(workspaceId);
  const sources = useSources(workspaceId);
  const links = useLinks(workspaceId);

  const claimParam = searchParams.get("claim");
  const relationParam = searchParams.get("relation");
  const selectedId = searchParams.get("source");
  const relation = RELATIONS.find((value) => value === relationParam) ?? null;

  const filter = useMemo(() => ({ claimId: claimParam, relation }), [claimParam, relation]);

  const setParams = (patch: Record<string, string | null>) => {
    const next = applyParamPatch(searchParams.toString(), patch);
    router.push(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  if (claims.isPending || sources.isPending || links.isPending)
    return <LoadingState label="Building graph" />;
  if (claims.isError || sources.isError || links.isError) {
    return (
      <ErrorState
        error={claims.error ?? sources.error ?? links.error}
        onRetry={() => {
          void claims.refetch();
          void sources.refetch();
          void links.refetch();
        }}
        title="The graph did not load"
      />
    );
  }
  if (claims.data.length === 0 && sources.data.length === 0) {
    return (
      <EmptyState
        title="Nothing to draw yet"
        description="The graph is built from your claims and sources. Add a claim and link a source to it."
      />
    );
  }

  const focusedClaim = claims.data.find((claim) => claim.id === claimParam);
  const selected = selectedId ? sources.data.find((source) => source.id === selectedId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-ink-muted flex flex-col gap-1 text-xs font-medium">
          Focus on a claim
          <select
            value={focusedClaim?.id ?? ""}
            onChange={(event) => setParams({ claim: event.target.value || null })}
            className="border-line bg-surface text-ink min-h-10 max-w-sm rounded-md border px-3 text-sm"
          >
            <option value="">All claims</option>
            {claims.data.map((claim) => (
              <option key={claim.id} value={claim.id}>
                {claim.statement.length > 70 ? `${claim.statement.slice(0, 70)}…` : claim.statement}
              </option>
            ))}
          </select>
        </label>
        <label className="text-ink-muted flex flex-col gap-1 text-xs font-medium">
          Relation
          <select
            value={relation ?? ""}
            onChange={(event) => setParams({ relation: event.target.value || null })}
            className="border-line bg-surface text-ink min-h-10 rounded-md border px-3 text-sm"
          >
            <option value="">All relations</option>
            {RELATIONS.map((value) => (
              <option key={value} value={value}>
                {RELATION_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        {focusedClaim ? (
          <Link
            href={`/workspaces/${workspaceId}/claims/${focusedClaim.id}`}
            className="text-accent min-h-10 content-center text-sm font-medium underline"
          >
            Open the evidence file
          </Link>
        ) : null}
      </div>

      <div className="text-ink-muted flex flex-col gap-1 text-sm">
        <ul aria-label="Line legend" className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {RELATIONS.map((value) => (
            <li key={value} className="flex items-center gap-2">
              <LegendLine relation={value} />
              {RELATION_LABELS[value]}
            </li>
          ))}
        </ul>
        <p>Select a claim to focus on it, or a source to read its details.</p>
      </div>

      <div className={selected ? "grid gap-6 xl:grid-cols-[1fr_28rem]" : ""}>
        <EvidenceGraph
          claims={claims.data}
          sources={sources.data}
          links={links.data}
          filter={filter}
          selectedSourceId={selected?.id ?? null}
          onSelectSource={(id) => setParams({ source: id })}
          onSelectClaim={(id) => setParams({ claim: id, source: null })}
        />
        {selected ? (
          <SourceDetailPanel
            workspaceId={workspaceId}
            source={selected}
            claims={claims.data}
            links={links.data}
            onClose={() => setParams({ source: null })}
          />
        ) : null}
      </div>
    </div>
  );
}
