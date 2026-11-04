import {
  RELATIONS,
  REVIEW_STATUSES,
  SOURCE_TYPES,
  type Relation,
  type ReviewStatus,
  type Source,
  type SourceType,
} from "@/lib/validation/schemas";

export const SORT_OPTIONS = ["newest", "oldest", "published", "title", "review"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export type SourceQuery = {
  q: string;
  review: ReviewStatus | null;
  type: SourceType | null;
  relation: Relation | null;
  flagged: boolean;
  sort: SortOption;
  selected: string | null;
};

export const DEFAULT_SOURCE_QUERY: SourceQuery = {
  q: "",
  review: null,
  type: null,
  relation: null,
  flagged: false,
  sort: "newest",
  selected: null,
};

function pick<T extends string>(options: readonly T[], value: string | null): T | null {
  return options.find((option) => option === value) ?? null;
}

export function parseSourceQuery(params: URLSearchParams): SourceQuery {
  return {
    q: (params.get("q") ?? "").slice(0, 200),
    review: pick(REVIEW_STATUSES, params.get("review")),
    type: pick(SOURCE_TYPES, params.get("type")),
    relation: pick(RELATIONS, params.get("relation")),
    flagged: params.get("flagged") === "1",
    sort: pick(SORT_OPTIONS, params.get("sort")) ?? DEFAULT_SOURCE_QUERY.sort,
    selected: params.get("source"),
  };
}

export function serializeSourceQuery(query: SourceQuery): string {
  const params = new URLSearchParams();
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.review) params.set("review", query.review);
  if (query.type) params.set("type", query.type);
  if (query.relation) params.set("relation", query.relation);
  if (query.flagged) params.set("flagged", "1");
  if (query.sort !== DEFAULT_SOURCE_QUERY.sort) params.set("sort", query.sort);
  if (query.selected) params.set("source", query.selected);
  params.sort();
  return params.toString();
}

const REVIEW_ORDER: Record<ReviewStatus, number> = {
  rejected: 0,
  unreviewed: 1,
  in_review: 2,
  verified: 3,
};

function matchesText(source: Source, needle: string): boolean {
  if (!needle) return true;
  const haystack = [source.title, source.url, source.note, source.excerpt].join("\n").toLowerCase();
  return needle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function filterSources<T extends Source>(
  sources: readonly T[],
  query: SourceQuery,
  relationsOf?: (source: T) => readonly Relation[],
): T[] {
  return sources.filter((source) => {
    if (query.review && source.review_status !== query.review) return false;
    if (query.type && source.source_type !== query.type) return false;
    if (query.flagged && !source.flagged) return false;
    if (query.relation && !relationsOf?.(source).includes(query.relation)) return false;
    return matchesText(source, query.q.trim());
  });
}

export function sortSources<T extends Source>(sources: readonly T[], sort: SortOption): T[] {
  const copy = [...sources];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case "published":
      return copy.sort((a, b) => {
        if (a.published_on === b.published_on) return a.title.localeCompare(b.title);
        if (!a.published_on) return 1;
        if (!b.published_on) return -1;
        return b.published_on.localeCompare(a.published_on);
      });
    case "title":
      return copy.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
    case "review":
      return copy.sort(
        (a, b) =>
          REVIEW_ORDER[a.review_status] - REVIEW_ORDER[b.review_status] ||
          a.title.localeCompare(b.title),
      );
    case "newest":
    default:
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

export function countActiveFilters(query: SourceQuery): number {
  return [query.q.trim(), query.review, query.type, query.relation, query.flagged].filter(Boolean)
    .length;
}
