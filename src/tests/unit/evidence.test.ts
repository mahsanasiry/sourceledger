import { describe, expect, it } from "vitest";
import {
  groupByRelation,
  linkedSourcesForClaim,
  sourcesNotLinkedTo,
  tallyClaims,
} from "@/features/evidence/evidence";
import { makeClaim, makeLink, makeSource } from "../fixtures";

const sources = [makeSource({ id: "s1" }), makeSource({ id: "s2" }), makeSource({ id: "s3" })];
const links = [
  makeLink({ source_id: "s1", relation: "supports" }),
  makeLink({ source_id: "s2", relation: "contradicts" }),
  makeLink({ claim_id: "c2", source_id: "s3", relation: "context" }),
];

describe("evidence helpers", () => {
  it("collects the sources linked to one claim with their relation", () => {
    const linked = linkedSourcesForClaim("c1", links, sources);
    expect(linked.map((source) => [source.id, source.relation])).toEqual([
      ["s1", "supports"],
      ["s2", "contradicts"],
    ]);
  });

  it("groups linked sources into the three evidence columns", () => {
    const columns = groupByRelation(linkedSourcesForClaim("c1", links, sources));
    expect(columns.supports).toHaveLength(1);
    expect(columns.contradicts).toHaveLength(1);
    expect(columns.context).toHaveLength(0);
  });

  it("tallies relations per claim, including claims without links", () => {
    const tallies = tallyClaims([makeClaim(), makeClaim({ id: "c2" }), makeClaim({ id: "c3" })], links);
    expect(tallies.get("c1")).toEqual({ supports: 1, contradicts: 1, context: 0 });
    expect(tallies.get("c3")).toEqual({ supports: 0, contradicts: 0, context: 0 });
  });

  it("lists sources that are not yet linked to a claim", () => {
    expect(sourcesNotLinkedTo("c1", links, sources).map((source) => source.id)).toEqual(["s3"]);
  });
});
