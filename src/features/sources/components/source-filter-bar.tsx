"use client";

import { REVIEW_LABELS, RELATION_LABELS } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  RELATIONS,
  REVIEW_STATUSES,
  SOURCE_TYPES,
  type Relation,
  type ReviewStatus,
  type SourceType,
} from "@/lib/validation/schemas";
import { SOURCE_TYPE_LABELS } from "./source-form";
import {
  SORT_OPTIONS,
  countActiveFilters,
  type SortOption,
  type SourceQuery,
} from "../source-query";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Recently added",
  oldest: "Oldest added",
  published: "Publication date",
  title: "Title A to Z",
  review: "Needs review first",
};

const CONTROL = "min-h-10 rounded-md border border-line bg-surface px-3 text-sm";

type SourceFilterBarProps = {
  query: SourceQuery;
  resultCount: number;
  totalCount: number;
  showRelation: boolean;
  onChange: (patch: Partial<SourceQuery>, options?: { history: "push" | "replace" }) => void;
};

export function SourceFilterBar({
  query,
  resultCount,
  totalCount,
  showRelation,
  onChange,
}: SourceFilterBarProps) {
  const activeFilters = countActiveFilters(query);

  return (
    <section aria-label="Search and filter sources" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <SearchInput
          id="source-search"
          label="Search sources"
          value={query.q}
          placeholder="Title, address, note or excerpt"
          className={`${CONTROL} w-full`}
          onCommit={(q) => onChange({ q }, { history: "replace" })}
        />
        <label className="text-ink-muted flex flex-col gap-1 text-xs font-medium">
          Review status
          <select
            value={query.review ?? ""}
            onChange={(event) =>
              onChange({ review: (event.target.value || null) as ReviewStatus | null })
            }
            className={`${CONTROL} text-ink`}
          >
            <option value="">All statuses</option>
            {REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>
                {REVIEW_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-ink-muted flex flex-col gap-1 text-xs font-medium">
          Type
          <select
            value={query.type ?? ""}
            onChange={(event) =>
              onChange({ type: (event.target.value || null) as SourceType | null })
            }
            className={`${CONTROL} text-ink`}
          >
            <option value="">All types</option>
            {SOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {SOURCE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        {showRelation ? (
          <label className="text-ink-muted flex flex-col gap-1 text-xs font-medium">
            Relation
            <select
              value={query.relation ?? ""}
              onChange={(event) =>
                onChange({ relation: (event.target.value || null) as Relation | null })
              }
              className={`${CONTROL} text-ink`}
            >
              <option value="">All relations</option>
              {RELATIONS.map((relation) => (
                <option key={relation} value={relation}>
                  {RELATION_LABELS[relation]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-ink-muted flex flex-col gap-1 text-xs font-medium">
          Sort by
          <select
            value={query.sort}
            onChange={(event) => onChange({ sort: event.target.value as SortOption })}
            className={`${CONTROL} text-ink`}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={query.flagged}
            onChange={(event) => onChange({ flagged: event.target.checked })}
            className="size-4"
          />
          Flagged only
        </label>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p role="status" className="text-ink-muted text-sm">
          Showing {resultCount} of {totalCount} {totalCount === 1 ? "source" : "sources"}
        </p>
        {activeFilters > 0 ? (
          <Button
            variant="ghost"
            onClick={() =>
              onChange({ q: "", review: null, type: null, relation: null, flagged: false })
            }
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </section>
  );
}
