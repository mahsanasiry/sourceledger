import { describe, expect, it } from "vitest";
import {
  ROWS_PER_COLUMN,
  buildGraphLayout,
  claimNodeId,
  sourceNodeId,
} from "@/features/evidence/graph-layout";
import { makeClaim, makeLink, makeSource } from "../fixtures";

const noFilter = { claimId: null, relation: null };

describe("buildGraphLayout", () => {
  const claims = [makeClaim({ id: "c1" }), makeClaim({ id: "c2", statement: "Second" })];
  const sources = [
    makeSource({ id: "s1", title: "One" }),
    makeSource({ id: "s2", title: "Two" }),
    makeSource({ id: "s3", title: "Unlinked" }),
  ];
  const links = [
    makeLink({ claim_id: "c1", source_id: "s1" }),
    makeLink({ claim_id: "c2", source_id: "s2", relation: "contradicts" }),
  ];

  it("creates a node per claim and source and an edge per link", () => {
    const layout = buildGraphLayout(claims, sources, links, noFilter);
    expect(layout.nodes).toHaveLength(5);
    expect(layout.edges.map((edge) => edge.relation).sort()).toEqual(["contradicts", "supports"]);
  });

  it("orders sources by the claims they connect to", () => {
    const layout = buildGraphLayout(claims, sources, links, noFilter);
    const y = (id: string) => layout.nodes.find((node) => node.id === sourceNodeId(id))?.y ?? -1;
    expect(y("s1")).toBeLessThan(y("s2"));
    expect(y("s2")).toBeLessThan(y("s3"));
  });

  it("narrows to one claim and its sources", () => {
    const layout = buildGraphLayout(claims, sources, links, { claimId: "c2", relation: null });
    expect(layout.nodes.map((node) => node.id).sort()).toEqual(
      [claimNodeId("c2"), sourceNodeId("s2")].sort(),
    );
  });

  it("narrows by relation and drops sources that no longer connect", () => {
    const layout = buildGraphLayout(claims, sources, links, { claimId: null, relation: "supports" });
    expect(layout.edges).toHaveLength(1);
    expect(layout.nodes.some((node) => node.id === sourceNodeId("s3"))).toBe(false);
  });

  it("wraps large source lists into additional columns", () => {
    const many = Array.from({ length: ROWS_PER_COLUMN * 3 + 1 }, (_, index) =>
      makeSource({ id: `x${index}`, title: `Source ${String(index).padStart(3, "0")}` }),
    );
    const layout = buildGraphLayout([makeClaim()], many, [], noFilter);
    const columns = new Set(layout.nodes.filter((node) => node.data.kind === "source").map((n) => n.x));
    expect(columns.size).toBe(4);
    const maxY = Math.max(...layout.nodes.map((node) => node.y));
    expect(maxY).toBeLessThan(ROWS_PER_COLUMN * 100);
  });

  it("ignores links that point at missing rows", () => {
    const layout = buildGraphLayout(claims, sources, [makeLink({ source_id: "gone" })], noFilter);
    expect(layout.edges).toHaveLength(0);
  });
});
