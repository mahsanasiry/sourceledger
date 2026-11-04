"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useClaims, useLinks } from "@/features/claims/hooks";
import { useSourceQueryState } from "@/lib/utils/use-url-state";
import type { Relation } from "@/lib/validation/schemas";
import { LinkAfterCreateError, useCreateSource, useSources } from "../hooks";
import { filterSources, sortSources } from "../source-query";
import { SourceCard } from "./source-card";
import { SourceDetailPanel } from "./source-detail-panel";
import { SourceFilterBar } from "./source-filter-bar";
import { SourceForm } from "./source-form";

export function SourcesView({ workspaceId }: { workspaceId: string }) {
  const toast = useToast();
  const { query, update } = useSourceQueryState();
  const sources = useSources(workspaceId);
  const claims = useClaims(workspaceId);
  const links = useLinks(workspaceId);
  const create = useCreateSource(workspaceId);
  const [adding, setAdding] = useState(false);

  const relationsBySource = useMemo(() => {
    const map = new Map<string, Relation[]>();
    for (const link of links.data ?? []) {
      map.set(link.source_id, [...(map.get(link.source_id) ?? []), link.relation]);
    }
    return map;
  }, [links.data]);

  const visible = useMemo(
    () =>
      sortSources(
        filterSources(
          sources.data ?? [],
          query,
          (source) => relationsBySource.get(source.id) ?? [],
        ),
        query.sort,
      ),
    [sources.data, query, relationsBySource],
  );

  if (sources.isPending || claims.isPending || links.isPending)
    return <LoadingState label="Loading sources" />;
  if (sources.isError || claims.isError || links.isError) {
    return (
      <ErrorState
        error={sources.error ?? claims.error ?? links.error}
        onRetry={() => {
          void sources.refetch();
          void claims.refetch();
          void links.refetch();
        }}
        title="Sources did not load"
      />
    );
  }

  const selected = query.selected
    ? sources.data.find((source) => source.id === query.selected)
    : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">All sources</h2>
        <Button onClick={() => setAdding(true)}>Add source</Button>
      </div>

      {sources.data.length === 0 ? (
        <EmptyState
          title="No sources yet"
          description="Record where information comes from, including the exact passage, so you can check it later."
          action={<Button onClick={() => setAdding(true)}>Add the first source</Button>}
        />
      ) : (
        <>
          <SourceFilterBar
            query={query}
            resultCount={visible.length}
            totalCount={sources.data.length}
            showRelation
            onChange={update}
          />
          <div className={selected ? "grid gap-6 xl:grid-cols-[1fr_28rem]" : ""}>
            {visible.length === 0 ? (
              <EmptyState
                title="No sources match"
                description="Loosen the search or clear a filter to see more."
                action={
                  <Button
                    variant="secondary"
                    onClick={() =>
                      update({ q: "", review: null, type: null, relation: null, flagged: false })
                    }
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <ul
                className={
                  selected ? "flex flex-col gap-2" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                }
              >
                {visible.map((source) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    selected={source.id === selected?.id}
                    onSelect={(id) => update({ selected: id })}
                  />
                ))}
              </ul>
            )}
            {selected ? (
              <SourceDetailPanel
                workspaceId={workspaceId}
                source={selected}
                claims={claims.data}
                links={links.data}
                onClose={() => update({ selected: null })}
              />
            ) : null}
          </div>
        </>
      )}

      <Modal open={adding} title="Add a source" onClose={() => setAdding(false)}>
        <SourceForm
          mode="create"
          claims={claims.data}
          submitting={create.isPending}
          error={create.error}
          onCancel={() => setAdding(false)}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: (source) => {
                setAdding(false);
                toast.success("Source added");
                update({ selected: source.id });
              },
              onError: (error) => {
                if (error instanceof LinkAfterCreateError) {
                  setAdding(false);
                  toast.error(error.message);
                  update({ selected: error.sourceId });
                }
              },
            })
          }
        />
      </Modal>
    </div>
  );
}
