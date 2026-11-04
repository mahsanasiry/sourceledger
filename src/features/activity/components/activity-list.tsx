"use client";

import { REVIEW_LABELS } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { formatDateTime } from "@/lib/utils/dates";
import type { Activity } from "@/lib/validation/schemas";
import { useActivity } from "../hooks";
import type { ActivityScope } from "../api";

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

function displayValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "empty";
  if (field === "review_status" && typeof value === "string" && value in REVIEW_LABELS) {
    return REVIEW_LABELS[value as keyof typeof REVIEW_LABELS];
  }
  if (field === "flagged") return value ? "flagged" : "not flagged";
  const text = String(value);
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

function ActivityEntry({ entry }: { entry: Activity }) {
  const changes = Object.entries(entry.changes);
  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{entry.summary}</p>
        <time dateTime={entry.created_at} className="text-xs text-ink-muted">
          {formatDateTime(entry.created_at)}
        </time>
      </div>
      <p className="mt-1 text-xs text-ink-muted">By {entry.actor_email ?? "an unknown user"}</p>
      {changes.length > 0 ? (
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          {changes.map(([field, change]) => (
            <div key={field}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {FIELD_LABELS[field] ?? field}
              </dt>
              <dd className="mt-0.5">
                <span className="text-ink-muted line-through">{displayValue(field, change.from)}</span>
                <span aria-hidden="true"> → </span>
                <span className="sr-only"> changed to </span>
                <span>{displayValue(field, change.to)}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {entry.reason ? (
        <p className="mt-3 rounded-md bg-surface-muted px-3 py-2 text-sm">
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
    return <ErrorState error={activity.error} onRetry={() => activity.refetch()} title="History did not load" />;
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
