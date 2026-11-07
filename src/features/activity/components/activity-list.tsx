"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { formatDateTime } from "@/lib/utils/dates";
import type { Activity } from "@/lib/validation/schemas";
import { useActivity } from "../hooks";
import type { ActivityScope } from "../api";
import { describeChange } from "../describe-change";

const FIELD_LABELS: Record<string, string> = {
  statement: "Claim",
  conclusion: "Conclusion",
  status: "Status",
  url: "Address",
  title: "Title",
  published_on: "Publication date",
  source_type: "Type",
  excerpt: "Excerpt",
  note: "Note",
  review_status: "Review status",
  flagged: "Flag",
  relation: "Relation",
  relation_note: "Relation note",
  name: "Name",
  description: "Description",
};

function ActivityEntry({ entry }: { entry: Activity }) {
  const changes = Object.entries(entry.changes);
  return (
    <li className="border-line bg-surface rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{entry.summary}</p>
        <time dateTime={entry.created_at} className="text-ink-muted text-xs">
          {formatDateTime(entry.created_at)}
        </time>
      </div>
      <p className="text-ink-muted mt-1 text-xs">By {entry.actor_email ?? "the system"}</p>
      {changes.length > 0 ? (
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          {changes.map(([field, change]) => {
            const description = describeChange(field, change.from, change.to);
            if (!description) return null;
            return (
              <div key={field}>
                <dt className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
                  {FIELD_LABELS[field] ?? field}
                </dt>
                <dd className="mt-0.5">
                  {description.kind === "changed" ? (
                    <>
                      <span className="text-ink-muted line-through">{description.from}</span>
                      <span aria-hidden="true"> → </span>
                      <span className="sr-only"> changed to </span>
                      <span>{description.to}</span>
                    </>
                  ) : null}
                  {description.kind === "set" ? <span>{description.to}</span> : null}
                  {description.kind === "removed" ? (
                    <>
                      <span className="text-ink-muted line-through">{description.from}</span>
                      <span> (removed)</span>
                    </>
                  ) : null}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
      {entry.reason ? (
        <p className="bg-surface-muted mt-3 rounded-md px-3 py-2 text-sm">
          <span className="font-medium">Reason: </span>
          {entry.reason}
        </p>
      ) : null}
    </li>
  );
}

type ActivityListProps = { workspaceId: string; scope?: ActivityScope; emptyText?: string };

export function ActivityList({ workspaceId, scope, emptyText }: ActivityListProps) {
  const activity = useActivity(workspaceId, scope);

  if (activity.isPending) return <LoadingState label="Loading history" />;
  if (activity.isError) {
    return (
      <ErrorState
        error={activity.error}
        onRetry={() => activity.refetch()}
        title="History did not load"
      />
    );
  }
  if (activity.data.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        description={emptyText ?? "Every change to claims, sources and links is recorded here."}
      />
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {activity.data.map((entry) => (
        <ActivityEntry key={entry.id} entry={entry} />
      ))}
    </ol>
  );
}
