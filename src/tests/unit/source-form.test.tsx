import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SourceForm } from "@/features/sources/components/source-form";
import { expectNoAccessibilityViolations } from "../axe";
import { makeClaim } from "../fixtures";

function setup() {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <SourceForm
      mode="create"
      claims={[makeClaim()]}
      submitting={false}
      error={null}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );
  return { onSubmit, onCancel, ...view };
}

describe("SourceForm", () => {
  it("explains what is wrong when required fields are empty", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.click(screen.getByRole("button", { name: "Add source" }));
    expect(await screen.findByText("Enter the address of the source")).toBeInTheDocument();
    expect(screen.getByText("Give the source a title")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects addresses that are not http or https", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText("Address"), "ftp://files.example.org/a");
    await user.type(screen.getByLabelText("Title"), "Archive");
    await user.click(screen.getByRole("button", { name: "Add source" }));
    expect(await screen.findByText(/starting with http/)).toBeInTheDocument();
  });

  it("submits the link choice together with the source", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByLabelText("Address"), "https://example.org/report");
    await user.type(screen.getByLabelText("Title"), "Annual report");
    await user.selectOptions(screen.getByLabelText("Claim"), "c1");
    await user.selectOptions(screen.getByLabelText("Relation"), "contradicts");
    await user.click(screen.getByRole("button", { name: "Add source" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      url: "https://example.org/report",
      title: "Annual report",
      claim_id: "c1",
      relation: "contradicts",
    });
  });

  it("only enables the relation choice once a claim is picked", async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByLabelText("Relation")).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Claim"), "c1");
    expect(screen.getByLabelText("Relation")).toBeEnabled();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup();
    await expectNoAccessibilityViolations(container);
  });
});
