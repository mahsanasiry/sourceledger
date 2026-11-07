"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ClaimStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, InlineError, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { ActivityList } from "@/features/activity/components/activity-list";
import { EvidenceBoard } from "@/features/evidence/components/evidence-board";
import {
  groupByRelation,
  linkedSourcesForClaim,
  sourcesNotLinkedTo,
} from "@/features/evidence/evidence";
import { SourceDetailPanel } from "@/features/sources/components/source-detail-panel";
import { SourceFilterBar } from "@/features/sources/components/source-filter-bar";
import { SourceForm } from "@/features/sources/components/source-form";
import { LinkAfterCreateError, useCreateSource, useSources } from "@/features/sources/hooks";
import { filterSources, sortSources } from "@/features/sources/source-query";
import { toUserMessage } from "@/lib/utils/errors";
import { useSourceQueryState } from "@/lib/utils/use-url-state";
import {
  useClaims,
  useDeleteClaim,
  useLinkExistingSource,
  useLinks,
  useUpdateClaim,
} from "../hooks";
import { ClaimForm } from "./claim-form";
import { LinkExistingSourceForm } from "./link-existing-source-form";

export function ClaimEvidenceFile({
  workspaceId,
  claimId,
}: {
  workspaceId: string;
  claimId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { query, update } = useSourceQueryState();
  const claims = useClaims(workspaceId);
  const sources = useSources(workspaceId);
  const links = useLinks(workspaceId);
  const updateClaim = useUpdateClaim(workspaceId, claimId);
  const deleteClaim = useDeleteClaim(workspaceId);
  const createSource = useCreateSource(workspaceId);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [linkingExisting, setLinkingExisting] = useState(false);
  const linkExisting = useLinkExistingSource(workspaceId);

  const claim = claims.data?.find((entry) => entry.id === claimId);

  const linked = useMemo(
    () => linkedSourcesForClaim(claimId, links.data ?? [], sources.data ?? []),
    [claimId, links.data, sources.data],
  );
  const visible = useMemo(
    () => sortSources(filterSources(linked, query), query.sort),
    [linked, query],
  );
  const columns = useMemo(() => groupByRelation(visible), [visible]);
  const candidates = useMemo(
    () =>
      sourcesNotLinkedTo(claimId, links.data ?? [], sources.data ?? []).sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      ),
    [claimId, links.data, sources.data],
  );

  if (claims.isPending || sources.isPending || links.isPending) {
    return <LoadingState label="Loading evidence file" />;
  }
  if (claims.isError || sources.isError || links.isError) {
    return (
      <ErrorState
        error={claims.error ?? sources.error ?? links.error}
        onRetry={() => {
          void claims.refetch();
          void sources.refetch();
          void links.refetch();
        }}
        title="The evidence file did not load"
      />
    );
  }
  if (!claim) {
    return (
      <EmptyState
        title="This claim no longer exists"
        description="It may have been deleted. Go back to the list of claims."
        action={
          <Link
            href={`/workspaces/${workspaceId}`}
            className="text-accent text-sm font-medium underline"
          >
            Back to claims
          </Link>
        }
      />
    );
  }

  const selected = query.selected
    ? sources.data.find((source) => source.id === query.selected)
    : undefined;
  const closePanel = () => update({ selected: null });
  const closeLinkExisting = () => {
    setLinkingExisting(false);
    linkExisting.reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="border-line bg-surface rounded-lg border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <p className="mb-2 flex items-center gap-2">
              <ClaimStatusBadge status={claim.status} />
            </p>
            <h2 className="font-serif text-2xl leading-snug font-semibold">{claim.statement}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit claim
            </Button>
            <Button variant="danger" onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold">Conclusion</h3>
          <p className="mt-1 text-sm whitespace-pre-wrap">
            {claim.conclusion || "No conclusion written yet."}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Evidence</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setLinkingExisting(true)}>
            Link existing source
          </Button>
          <Button onClick={() => setAddingSource(true)}>Add source</Button>
        </div>
      </div>

      <SourceFilterBar
        query={query}
        resultCount={visible.length}
        totalCount={linked.length}
        showRelation={false}
        onChange={update}
      />

      {linked.length === 0 ? (
        <EmptyState
          title="No sources linked yet"
          description="Add a source and choose whether it supports, contradicts or gives context for this claim."
          action={<Button onClick={() => setAddingSource(true)}>Add the first source</Button>}
        />
      ) : (
        <div className={selected ? "grid gap-6 xl:grid-cols-[1fr_28rem]" : ""}>
          <EvidenceBoard
            columns={columns}
            selectedId={selected?.id ?? null}
            onSelect={(id) => update({ selected: id })}
          />
          {selected ? (
            <SourceDetailPanel
              workspaceId={workspaceId}
              source={selected}
              claims={claims.data}
              links={links.data}
              onClose={closePanel}
            />
          ) : null}
        </div>
      )}

      <section aria-labelledby="claim-history">
        <h2 id="claim-history" className="mb-3 text-lg font-semibold">
          Claim history
        </h2>
        <ActivityList
          workspaceId={workspaceId}
          scope={{ claimId, limit: 100 }}
          emptyText="Changes to this claim and its links will appear here."
        />
      </section>

      <Modal open={editing} title="Edit claim" onClose={() => setEditing(false)}>
        <ClaimForm
          mode="edit"
          initialValues={{
            statement: claim.statement,
            conclusion: claim.conclusion,
            status: claim.status,
            reason: "",
          }}
          submitting={updateClaim.isPending}
          error={updateClaim.error}
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            updateClaim.mutate(values, {
              onSuccess: () => {
                setEditing(false);
                toast.success("Claim updated");
              },
            })
          }
        />
      </Modal>

      <Modal open={deleting} title="Delete this claim?" onClose={() => setDeleting(false)}>
        <p className="text-sm">
          The claim and its links will be removed. The sources stay in the workspace, and the
          deletion is kept in the history.
        </p>
        <div className="mt-4">
          <InlineError message={deleteClaim.error ? toUserMessage(deleteClaim.error) : null} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setDeleting(false)}
            disabled={deleteClaim.isPending}
          >
            Keep claim
          </Button>
          <Button
            variant="destructive"
            loading={deleteClaim.isPending}
            onClick={() =>
              deleteClaim.mutate(claimId, {
                onSuccess: () => {
                  toast.success("Claim deleted");
                  router.replace(`/workspaces/${workspaceId}`);
                },
              })
            }
          >
            Delete claim
          </Button>
        </div>
      </Modal>

      <Modal open={linkingExisting} title="Link an existing source" onClose={closeLinkExisting}>
        {candidates.length === 0 ? (
          <>
            <p className="text-sm">
              Every source in this workspace is already linked to this claim. Add a new source
              instead.
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={closeLinkExisting}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <LinkExistingSourceForm
            candidates={candidates}
            submitting={linkExisting.isPending}
            error={linkExisting.error}
            onCancel={closeLinkExisting}
            onSubmit={(values) =>
              linkExisting.mutate(
                {
                  claimId,
                  sourceId: values.source_id,
                  relation: values.relation,
                  relationNote: values.relation_note,
                },
                {
                  onSuccess: () => {
                    closeLinkExisting();
                    toast.success("Source linked");
                    update({ selected: values.source_id });
                  },
                },
              )
            }
          />
        )}
      </Modal>

      <Modal open={addingSource} title="Add a source" onClose={() => setAddingSource(false)}>
        <SourceForm
          mode="create"
          claims={claims.data}
          initialValues={{
            url: "",
            title: "",
            published_on: "",
            source_type: "news",
            excerpt: "",
            note: "",
            claim_id: claimId,
            relation: "supports",
          }}
          submitting={createSource.isPending}
          error={createSource.error}
          onCancel={() => setAddingSource(false)}
          onSubmit={(values) =>
            createSource.mutate(values, {
              onSuccess: (source) => {
                setAddingSource(false);
                toast.success("Source added");
                update({ selected: source.id });
              },
              onError: (error) => {
                if (error instanceof LinkAfterCreateError) {
                  setAddingSource(false);
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
