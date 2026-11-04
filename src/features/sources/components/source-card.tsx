import { FlagBadge, RelationBadge, ReviewBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";
import type { Relation, Source } from "@/lib/validation/schemas";
import { SOURCE_TYPE_LABELS } from "./source-form";

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type SourceCardProps = {
  source: Source;
  relation?: Relation;
  relationNote?: string;
  selected: boolean;
  onSelect: (sourceId: string) => void;
};

export function SourceCard({
  source,
  relation,
  relationNote,
  selected,
  onSelect,
}: SourceCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(source.id)}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "bg-surface hover:border-accent flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition",
          selected ? "border-accent ring-accent ring-2" : "border-line",
        )}
      >
        <span className="text-sm leading-snug font-semibold">{source.title}</span>
        <span className="text-ink-muted text-xs">
          {hostOf(source.url)} · {formatDate(source.published_on)} ·{" "}
          {SOURCE_TYPE_LABELS[source.source_type]}
        </span>
        <span className="flex flex-wrap gap-1.5">
          {relation ? <RelationBadge relation={relation} /> : null}
          <ReviewBadge status={source.review_status} />
          {source.flagged ? <FlagBadge /> : null}
        </span>
        {relationNote ? <span className="text-ink-muted text-xs">{relationNote}</span> : null}
      </button>
    </li>
  );
}
