import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOURCE_QUERY,
  filterSources,
  parseSourceQuery,
  serializeSourceQuery,
  sortSources,
} from "@/features/sources/source-query";
import { makeSource } from "../fixtures";

describe("source query url state", () => {
  it("round-trips every field through the url", () => {
    const query = {
      q: "survey",
      review: "verified" as const,
      type: "academic" as const,
      relation: "contradicts" as const,
      flagged: true,
      sort: "title" as const,
      selected: "abc",
    };
    expect(parseSourceQuery(new URLSearchParams(serializeSourceQuery(query)))).toEqual(query);
  });

  it("falls back to defaults for unknown values", () => {
    const params = new URLSearchParams("review=banana&sort=sideways&type=&flagged=yes");
    expect(parseSourceQuery(params)).toEqual(DEFAULT_SOURCE_QUERY);
  });

  it("omits default values so urls stay short", () => {
    expect(serializeSourceQuery(DEFAULT_SOURCE_QUERY)).toBe("");
  });
});

describe("filterSources", () => {
  const sources = [
    makeSource({ id: "a", title: "Bike lane survey", review_status: "verified" }),
    makeSource({ id: "b", title: "Driver complaints", flagged: true, source_type: "news" }),
    makeSource({ id: "c", title: "Road safety data", note: "mentions survey design" }),
  ];

  it("matches every search term across title, url, note and excerpt", () => {
    const result = filterSources(sources, { ...DEFAULT_SOURCE_QUERY, q: "survey design" });
    expect(result.map((source) => source.id)).toEqual(["c"]);
  });

  it("combines review status, type and flag filters", () => {
    expect(filterSources(sources, { ...DEFAULT_SOURCE_QUERY, review: "verified" })).toHaveLength(1);
    expect(filterSources(sources, { ...DEFAULT_SOURCE_QUERY, type: "news", flagged: true })).toHaveLength(1);
    expect(filterSources(sources, { ...DEFAULT_SOURCE_QUERY, type: "news", review: "verified" })).toHaveLength(0);
  });

  it("filters by relation through the supplied lookup", () => {
    const result = filterSources(
      sources,
      { ...DEFAULT_SOURCE_QUERY, relation: "supports" },
      (source) => (source.id === "a" ? "supports" : "context"),
    );
    expect(result.map((source) => source.id)).toEqual(["a"]);
  });
});

describe("sortSources", () => {
  const sources = [
    makeSource({ id: "a", title: "b", published_on: null, created_at: "2024-01-01T00:00:00Z" }),
    makeSource({ id: "b", title: "a", published_on: "2023-01-01", created_at: "2024-03-01T00:00:00Z" }),
    makeSource({ id: "c", title: "c", published_on: "2024-01-01", created_at: "2024-02-01T00:00:00Z", review_status: "rejected" }),
  ];

  it("sorts newest first by default", () => {
    expect(sortSources(sources, "newest").map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("puts undated sources last when sorting by publication date", () => {
    expect(sortSources(sources, "published").map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  it("sorts titles alphabetically and review status by urgency", () => {
    expect(sortSources(sources, "title").map((s) => s.id)).toEqual(["b", "a", "c"]);
    expect(sortSources(sources, "review")[0]?.id).toBe("c");
  });

  it("does not mutate its input", () => {
    const before = sources.map((s) => s.id);
    sortSources(sources, "title");
    expect(sources.map((s) => s.id)).toEqual(before);
  });
});
