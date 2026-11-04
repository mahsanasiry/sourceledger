import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SourceFilterBar } from "@/features/sources/components/source-filter-bar";
import { DEFAULT_SOURCE_QUERY } from "@/features/sources/source-query";
import { expectNoAccessibilityViolations } from "../axe";

function setup(query = DEFAULT_SOURCE_QUERY) {
  const onChange = vi.fn();
  const view = render(
    <SourceFilterBar
      query={query}
      resultCount={2}
      totalCount={5}
      showRelation
      onChange={onChange}
    />,
  );
  return { onChange, ...view };
}

describe("SourceFilterBar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for a pause in typing, then replaces the url entry", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onChange } = setup();
    await user.type(screen.getByLabelText("Search sources"), "survey");
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ q: "survey" }, { history: "replace" });
  });

  it("pushes discrete filter changes as history entries", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onChange } = setup();
    await user.selectOptions(screen.getByLabelText("Review status"), "verified");
    expect(onChange).toHaveBeenCalledWith({ review: "verified" });
    await user.click(screen.getByLabelText("Flagged only"));
    expect(onChange).toHaveBeenCalledWith({ flagged: true });
  });

  it("reflects the url state it is given and offers to clear it", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onChange } = setup({ ...DEFAULT_SOURCE_QUERY, q: "lane", type: "news", sort: "title" });
    expect(screen.getByLabelText("Search sources")).toHaveValue("lane");
    expect(screen.getByLabelText("Type")).toHaveValue("news");
    expect(screen.getByLabelText("Sort by")).toHaveValue("title");
    expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 5 sources");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onChange).toHaveBeenCalledWith({
      q: "",
      review: null,
      type: null,
      relation: null,
      flagged: false,
    });
  });

  it("follows the url when it changes from outside, as Back does", () => {
    const { rerender } = setup({ ...DEFAULT_SOURCE_QUERY, q: "first" });
    rerender(
      <SourceFilterBar
        query={{ ...DEFAULT_SOURCE_QUERY, q: "second" }}
        resultCount={1}
        totalCount={5}
        showRelation
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Search sources")).toHaveValue("second");
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup();
    await expectNoAccessibilityViolations(container);
  });
});
