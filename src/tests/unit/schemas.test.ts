import { describe, expect, it } from "vitest";
import {
  authFormSchema,
  claimFormSchema,
  linkExistingFormSchema,
  reviewFormSchema,
  sourceFormSchema,
} from "@/lib/validation/schemas";
import { applyParamPatch } from "@/lib/utils/search-params";
import { fromDatabaseError, toUserMessage } from "@/lib/utils/errors";

const validSource = {
  url: "https://example.org/report",
  title: "Report",
  published_on: "2024-02-29",
  source_type: "report" as const,
  excerpt: "",
  note: "",
  claim_id: "",
  relation: "supports" as const,
};

describe("form schemas", () => {
  it("accepts a valid source and an empty publication date", () => {
    expect(sourceFormSchema.safeParse(validSource).success).toBe(true);
    expect(sourceFormSchema.safeParse({ ...validSource, published_on: "" }).success).toBe(true);
  });

  it("rejects non-http addresses and impossible dates", () => {
    expect(sourceFormSchema.safeParse({ ...validSource, url: "javascript:alert(1)" }).success).toBe(
      false,
    );
    expect(sourceFormSchema.safeParse({ ...validSource, url: "example.org" }).success).toBe(false);
    expect(sourceFormSchema.safeParse({ ...validSource, published_on: "2024-13-45" }).success).toBe(
      false,
    );
  });

  it("requires a reason when changing review status", () => {
    expect(reviewFormSchema.safeParse({ review_status: "verified", reason: " " }).success).toBe(
      false,
    );
    expect(
      reviewFormSchema.safeParse({ review_status: "verified", reason: "Checked appendix" }).success,
    ).toBe(true);
  });

  it("trims claim statements before measuring them", () => {
    const result = claimFormSchema.safeParse({
      statement: "   ",
      conclusion: "",
      status: "open",
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires a source when linking an existing one", () => {
    expect(
      linkExistingFormSchema.safeParse({ source_id: "", relation: "supports", relation_note: "" })
        .success,
    ).toBe(false);
    expect(
      linkExistingFormSchema.safeParse({ source_id: "s1", relation: "context", relation_note: "" })
        .success,
    ).toBe(true);
    expect(
      linkExistingFormSchema.safeParse({ source_id: "s1", relation: "unknown", relation_note: "" })
        .success,
    ).toBe(false);
  });

  it("validates email and password length", () => {
    expect(
      authFormSchema.safeParse({ email: "not-an-email", password: "longenough" }).success,
    ).toBe(false);
    expect(authFormSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
    expect(authFormSchema.safeParse({ email: "a@b.co", password: "longenough" }).success).toBe(
      true,
    );
  });
});

describe("utilities", () => {
  it("patches search params and drops empty values", () => {
    expect(applyParamPatch("q=a&sort=title", { q: "", review: "verified" })).toBe(
      "review=verified&sort=title",
    );
  });

  it("maps database error codes to readable messages", () => {
    expect(fromDatabaseError({ message: "x", code: "42501" }).message).toMatch(/permission/);
    expect(toUserMessage(new TypeError("fetch failed"))).toMatch(/network/);
    expect(toUserMessage("odd")).toBe("Something went wrong. Try again.");
  });
});
