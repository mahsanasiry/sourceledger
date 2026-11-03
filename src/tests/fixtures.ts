import type { Claim, ClaimSource, Source } from "@/lib/validation/schemas";

export function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: "s1",
    workspace_id: "w1",
    url: "https://example.org/a",
    title: "Regional survey",
    published_on: "2024-03-12",
    source_type: "report",
    excerpt: "Median commute fell by five minutes.",
    note: "Self reported",
    review_status: "unreviewed",
    flagged: false,
    created_at: "2024-05-01T10:00:00Z",
    updated_at: "2024-05-01T10:00:00Z",
    ...overrides,
  };
}

export function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "c1",
    workspace_id: "w1",
    statement: "Protected lanes shorten commutes",
    conclusion: "",
    status: "open",
    created_at: "2024-05-01T10:00:00Z",
    updated_at: "2024-05-01T10:00:00Z",
    ...overrides,
  };
}

export function makeLink(overrides: Partial<ClaimSource> = {}): ClaimSource {
  return {
    claim_id: "c1",
    source_id: "s1",
    workspace_id: "w1",
    relation: "supports",
    relation_note: "",
    created_at: "2024-05-01T10:00:00Z",
    updated_at: "2024-05-01T10:00:00Z",
    ...overrides,
  };
}
