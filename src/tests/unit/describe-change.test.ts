import { describe, expect, it } from "vitest";
import { describeChange } from "@/features/activity/describe-change";

describe("describeChange", () => {
  it("shows only the new value when something is set for the first time", () => {
    expect(describeChange("relation", null, "context")).toEqual({ kind: "set", to: "Context" });
  });

  it("shows the old value as removed when a value goes away", () => {
    expect(describeChange("relation", "contradicts", null)).toEqual({
      kind: "removed",
      from: "Contradicts",
    });
  });

  it("shows both values when one replaces another", () => {
    expect(describeChange("review_status", "in_review", "verified")).toEqual({
      kind: "changed",
      from: "In review",
      to: "Verified",
    });
    expect(describeChange("source_type", "news", "academic")).toEqual({
      kind: "changed",
      from: "News article",
      to: "Academic paper",
    });
  });

  it("writes the flag as words", () => {
    expect(describeChange("flagged", false, true)).toEqual({
      kind: "changed",
      from: "Not flagged",
      to: "Flagged",
    });
  });

  it("treats empty text as no value and ignores changes with nothing on either side", () => {
    expect(describeChange("note", "", "Checked")).toEqual({ kind: "set", to: "Checked" });
    expect(describeChange("note", "", null)).toBeNull();
  });

  it("shortens very long text", () => {
    const result = describeChange("excerpt", null, "x".repeat(400));
    expect(result?.kind === "set" && result.to.length).toBe(161);
  });
});
