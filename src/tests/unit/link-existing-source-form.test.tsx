import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LinkExistingSourceForm } from "@/features/claims/components/link-existing-source-form";
import { expectNoAccessibilityViolations } from "../axe";
import { makeSource } from "../fixtures";

const candidates = [
  makeSource({ id: "s1", title: "Regional survey", url: "https://www.example.org/survey" }),
  makeSource({ id: "s2", title: "Road safety data", url: "https://data.example.org/safety" }),
];

function setup(overrides: Partial<Parameters<typeof LinkExistingSourceForm>[0]> = {}) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <LinkExistingSourceForm
      candidates={candidates}
      submitting={false}
      error={null}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onSubmit, onCancel, ...view };
}

describe("LinkExistingSourceForm", () => {
  it("lists each candidate with its host so similar titles can be told apart", () => {
    setup();
    expect(
      screen.getByRole("option", { name: "Regional survey (example.org)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Road safety data (data.example.org)" }),
    ).toBeInTheDocument();
  });

  it("asks for a source before submitting", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.click(screen.getByRole("button", { name: "Link source" }));
    expect(await screen.findByText("Choose a source", { selector: "p" })).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the chosen source, relation and note", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.selectOptions(screen.getByLabelText("Source"), "s2");
    await user.selectOptions(screen.getByLabelText("Relation to this claim"), "contradicts");
    await user.type(screen.getByLabelText("Why does it relate this way?"), "Different time period");
    await user.click(screen.getByRole("button", { name: "Link source" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      source_id: "s2",
      relation: "contradicts",
      relation_note: "Different time period",
    });
  });

  it("disables the buttons and shows the server message while it is busy or failed", () => {
    setup({ submitting: true, error: new Error("Network down") });
    expect(screen.getByRole("alert")).toHaveTextContent("Network down");
    expect(screen.getByRole("button", { name: "Link source" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup();
    await expectNoAccessibilityViolations(container);
  });
});
