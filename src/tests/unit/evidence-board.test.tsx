import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EvidenceBoard } from "@/features/evidence/components/evidence-board";
import { groupByRelation, type LinkedSource } from "@/features/evidence/evidence";
import { expectNoAccessibilityViolations } from "../axe";
import { makeSource } from "../fixtures";

const linked: LinkedSource[] = [
  {
    ...makeSource({ id: "a", title: "Regional survey" }),
    relation: "supports",
    relation_note: "Direct measurement",
  },
  {
    ...makeSource({ id: "b", title: "Driver complaints", flagged: true }),
    relation: "contradicts",
    relation_note: "",
  },
];

function setup(selectedId: string | null = null) {
  const onSelect = vi.fn();
  const view = render(
    <EvidenceBoard columns={groupByRelation(linked)} selectedId={selectedId} onSelect={onSelect} />,
  );
  return { onSelect, ...view };
}

describe("EvidenceBoard", () => {
  it("places sources side by side in the column for their relation", () => {
    setup();
    const supports = screen.getByRole("region", { name: /Supports/ });
    const contradicts = screen.getByRole("region", { name: /Contradicts/ });
    expect(within(supports).getByText("Regional survey")).toBeInTheDocument();
    expect(within(contradicts).getByText("Driver complaints")).toBeInTheDocument();
    expect(within(contradicts).getByText("Flagged")).toBeInTheDocument();
  });

  it("says when a column has nothing to show", () => {
    setup();
    expect(screen.getByText("No context sources match.")).toBeInTheDocument();
  });

  it("reports which source was chosen and marks the current one", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup("a");
    await user.click(screen.getByRole("button", { name: /Driver complaints/ }));
    expect(onSelect).toHaveBeenCalledWith("b");
    expect(screen.getByRole("button", { name: /Regional survey/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup("a");
    await expectNoAccessibilityViolations(container);
  });
});
