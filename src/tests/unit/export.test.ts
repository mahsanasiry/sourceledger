import { describe, expect, it } from "vitest";
import { escapeCsvCell, toCsv } from "@/features/export/csv";
import {
  buildCsvExport,
  buildJsonExport,
  exportFileName,
} from "@/features/export/workspace-export";
import { makeClaim, makeLink, makeSource } from "../fixtures";

const workspace = {
  id: "w1",
  name: "Cycling policy",
  description: "",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("csv escaping", () => {
  it("quotes cells containing commas, quotes and line breaks", () => {
    expect(escapeCsvCell('say "hi", twice')).toBe('"say ""hi"", twice"');
    expect(escapeCsvCell("two\nlines")).toBe('"two\nlines"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(escapeCsvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(escapeCsvCell("+1")).toBe("'+1");
  });

  it("renders null and undefined as empty cells", () => {
    expect(toCsv(["a", "b"], [[null, undefined]])).toBe("a,b\r\n,\r\n");
  });
});

describe("workspace export", () => {
  const snapshot = {
    workspace,
    claims: [makeClaim()],
    sources: [makeSource(), makeSource({ id: "s2", title: "Orphan source" })],
    links: [makeLink({ relation_note: "direct measurement" })],
    activity: [],
  };

  it("writes one csv row per link plus unlinked sources", () => {
    const lines = buildCsvExport(snapshot).trim().split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("supports");
    expect(lines[1]).toContain("direct measurement");
    expect(lines[2]).toContain("Orphan source");
  });

  it("includes every collection in the json export", () => {
    const parsed = JSON.parse(buildJsonExport(snapshot, new Date("2024-06-01T12:00:00Z")));
    expect(parsed.exported_at).toBe("2024-06-01T12:00:00.000Z");
    expect(parsed.claims).toHaveLength(1);
    expect(parsed.sources).toHaveLength(2);
    expect(parsed.links).toHaveLength(1);
  });

  it("builds a safe file name", () => {
    expect(exportFileName("Sample: City / Cycling!", "csv", new Date("2024-06-01T12:00:00Z"))).toBe(
      "sample-city-cycling-2024-06-01.csv",
    );
    expect(exportFileName("???", "json", new Date("2024-06-01T12:00:00Z"))).toBe(
      "workspace-2024-06-01.json",
    );
  });
});
