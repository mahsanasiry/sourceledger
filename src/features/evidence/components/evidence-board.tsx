import { RELATION_LABELS } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { SourceCard } from "@/features/sources/components/source-card";
import { RELATIONS, type Relation } from "@/lib/validation/schemas";
import type { LinkedSource } from "../evidence";

const COLUMN_STYLES: Record<Relation, string> = {
  supports: "border-t-support",
  contradicts: "border-t-contradict",
  context: "border-t-context",
};

const EMPTY_TEXT: Record<Relation, string> = {
  supports: "No supporting sources match.",
  contradicts: "No contradicting sources match.",
  context: "No context sources match.",
};

type EvidenceBoardProps = {
  columns: Record<Relation, LinkedSource[]>;
  selectedId: string | null;
  onSelect: (sourceId: string) => void;
};

export function EvidenceBoard({ columns, selectedId, onSelect }: EvidenceBoardProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {RELATIONS.map((relation) => {
        const headingId = `board-${relation}`;
        const items = columns[relation];
        return (
          <section
            key={relation}
            aria-labelledby={headingId}
            className={cn(
              "border-line bg-surface-muted rounded-lg border border-t-4 p-3",
              COLUMN_STYLES[relation],
            )}
          >
            <h3
              id={headingId}
              className="mb-3 flex items-center justify-between text-sm font-semibold"
            >
              {RELATION_LABELS[relation]}
              <span className="bg-surface text-ink-muted rounded-full px-2 py-0.5 text-xs">
                {items.length}
              </span>
            </h3>
            {items.length === 0 ? (
              <p className="text-ink-muted px-1 py-4 text-sm">{EMPTY_TEXT[relation]}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((source) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    relationNote={source.relation_note}
                    selected={source.id === selectedId}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
