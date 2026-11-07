"use client";

import { useEffect, useRef, useState } from "react";
import { FlagBadge, RelationBadge, ReviewBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { InlineError } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { ActivityList } from "@/features/activity/components/activity-list";
import { useRemoveLink, useUpsertLink } from "@/features/claims/hooks";
import { formatDate } from "@/lib/utils/dates";
import { toUserMessage } from "@/lib/utils/errors";
import type { Claim, ClaimSource, Source } from "@/lib/validation/schemas";
import { useDeleteSource, useSetReviewStatus, useToggleFlag, useUpdateSource } from "../hooks";
import { LinkForm } from "./link-form";
import { ReviewForm } from "./review-form";
import { hostOf } from "./source-card";
import { SOURCE_TYPE_LABELS, SourceForm } from "./source-form";

type SourceDetailPanelProps = {
  workspaceId: string;
  source: Source;
  claims: Claim[];
  links: ClaimSource[];
  onClose: () => void;
};

export function SourceDetailPanel({
  workspaceId,
  source,
  claims,
  links,
  onClose,
}: SourceDetailPanelProps) {
  const toast = useToast();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const review = useSetReviewStatus(workspaceId, source.id);
  const flag = useToggleFlag(workspaceId);
  const update = useUpdateSource(workspaceId, source.id);
  const link = useUpsertLink(workspaceId, source.id);
  const unlink = useRemoveLink(workspaceId);
  const remove = useDeleteSource(workspaceId);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    headingRef.current?.focus();
    return () => {
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [source.id]);

  const claimById = new Map(claims.map((claim) => [claim.id, claim]));
  const sourceLinks = links.filter((entry) => entry.source_id === source.id);

  return (
    <aside
      aria-labelledby="source-panel-title"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !editing) onClose();
      }}
      className="border-line bg-surface flex flex-col gap-5 rounded-lg border p-5"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="source-panel-title"
            ref={headingRef}
            tabIndex={-1}
            className="text-lg leading-snug font-semibold outline-none"
          >
            {source.title}
          </h2>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent mt-1 inline-block text-sm break-all underline"
          >
            {hostOf(source.url)}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <Button variant="ghost" onClick={onClose} aria-label="Close source details">
          Close
        </Button>
      </header>

      <div className="flex flex-wrap gap-1.5">
        <ReviewBadge status={source.review_status} />
        {source.flagged ? <FlagBadge /> : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
            Published
          </dt>
          <dd>{formatDate(source.published_on)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted text-xs font-semibold tracking-wide uppercase">Type</dt>
          <dd>{SOURCE_TYPE_LABELS[source.source_type]}</dd>
        </div>
      </dl>

      <section aria-labelledby="source-excerpt">
        <h3 id="source-excerpt" className="text-sm font-semibold">
          What the source says
        </h3>
        {source.excerpt ? (
          <blockquote className="border-line mt-1 border-l-4 pl-3 text-sm">
            {source.excerpt}
          </blockquote>
        ) : (
          <p className="text-ink-muted mt-1 text-sm">
            No passage recorded. Edit the source to paste the exact wording.
          </p>
        )}
      </section>

      <section aria-labelledby="source-note">
        <h3 id="source-note" className="text-sm font-semibold">
          Your note
        </h3>
        <p className="mt-1 text-sm whitespace-pre-wrap">{source.note || "No note yet."}</p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit source
        </Button>
        <Button
          variant="secondary"
          aria-pressed={source.flagged}
          onClick={() =>
            flag.mutate(
              { sourceId: source.id, flagged: !source.flagged },
              {
                onSuccess: () => toast.success(source.flagged ? "Flag removed" : "Source flagged"),
                onError: (error) => toast.error(toUserMessage(error)),
              },
            )
          }
        >
          {source.flagged ? "Remove flag" : "Flag source"}
        </Button>
        <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
          Delete
        </Button>
      </div>

      <section aria-labelledby="source-review" className="border-line rounded-md border p-4">
        <h3 id="source-review" className="mb-3 text-sm font-semibold">
          Review
        </h3>
        <ReviewForm
          key={source.review_status}
          current={source.review_status}
          submitting={review.isPending}
          error={review.error}
          onSubmit={(values) =>
            review.mutate(values, { onSuccess: () => toast.success("Review status recorded") })
          }
        />
      </section>

      <section aria-labelledby="source-links" className="border-line rounded-md border p-4">
        <h3 id="source-links" className="mb-3 text-sm font-semibold">
          Linked claims
        </h3>
        {sourceLinks.length === 0 ? (
          <p className="text-ink-muted mb-3 text-sm">This source is not linked to any claim yet.</p>
        ) : (
          <ul className="mb-4 flex flex-col gap-2">
            {sourceLinks.map((entry) => (
              <li key={entry.claim_id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <RelationBadge relation={entry.relation} />{" "}
                  <span>{claimById.get(entry.claim_id)?.statement ?? "Deleted claim"}</span>
                  {entry.relation_note ? (
                    <span className="text-ink-muted mt-0.5 block text-xs">
                      {entry.relation_note}
                    </span>
                  ) : null}
                </span>
                <Button
                  variant="ghost"
                  loading={unlink.isPending && unlink.variables?.claimId === entry.claim_id}
                  onClick={() =>
                    unlink.mutate(
                      { claimId: entry.claim_id, sourceId: source.id },
                      {
                        onSuccess: () => toast.success("Link removed"),
                        onError: (error) => toast.error(toUserMessage(error)),
                      },
                    )
                  }
                >
                  Unlink
                </Button>
              </li>
            ))}
          </ul>
        )}
        <LinkForm
          claims={claims}
          submitting={link.isPending}
          error={link.error}
          onSubmit={(values) =>
            link.mutate(values, { onSuccess: () => toast.success("Link saved") })
          }
        />
      </section>

      <section aria-labelledby="source-history">
        <h3 id="source-history" className="mb-3 text-sm font-semibold">
          History
        </h3>
        <ActivityList workspaceId={workspaceId} scope={{ sourceId: source.id, limit: 50 }} />
      </section>

      <Modal open={editing} title="Edit source" onClose={() => setEditing(false)}>
        <SourceForm
          mode="edit"
          claims={claims}
          initialValues={{
            url: source.url,
            title: source.title,
            published_on: source.published_on ?? "",
            source_type: source.source_type,
            excerpt: source.excerpt,
            note: source.note,
            claim_id: "",
            relation: "supports",
          }}
          submitting={update.isPending}
          error={update.error}
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            update.mutate(values, {
              onSuccess: () => {
                setEditing(false);
                toast.success("Source updated");
              },
            })
          }
        />
      </Modal>

      <Modal
        open={confirmingDelete}
        title="Delete this source?"
        onClose={() => setConfirmingDelete(false)}
      >
        <p className="text-sm">
          The source and its links to claims will be removed. The deletion stays in the workspace
          history.
        </p>
        <div className="mt-4">
          <InlineError message={remove.error ? toUserMessage(remove.error) : null} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setConfirmingDelete(false)}
            disabled={remove.isPending}
          >
            Keep source
          </Button>
          <Button
            variant="destructive"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(source.id, {
                onSuccess: () => {
                  setConfirmingDelete(false);
                  toast.success("Source deleted");
                  onClose();
                },
              })
            }
          >
            Delete source
          </Button>
        </div>
      </Modal>
    </aside>
  );
}
