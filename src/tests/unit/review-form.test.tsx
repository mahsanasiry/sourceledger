import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReviewForm } from "@/features/sources/components/review-form";
import { expectNoAccessibilityViolations } from "../axe";

function setup(overrides: Partial<Parameters<typeof ReviewForm>[0]> = {}) {
  const onSubmit = vi.fn();
  const view = render(
    <ReviewForm
      current="unreviewed"
      submitting={false}
      error={null}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onSubmit, ...view };
}

describe("ReviewForm", () => {
  it("keeps the submit button disabled until the status changes", async () => {
    const user = userEvent.setup();
    setup();
    const submit = screen.getByRole("button", { name: "Record status change" });
    expect(submit).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Review status"), "verified");
    expect(submit).toBeEnabled();
  });

  it("refuses to submit without a reason", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.selectOptions(screen.getByLabelText("Review status"), "verified");
    await user.click(screen.getByRole("button", { name: "Record status change" }));
    expect(await screen.findByText("Say why the status is changing")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the new status together with the reason", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.selectOptions(screen.getByLabelText("Review status"), "rejected");
    await user.type(
      screen.getByLabelText("Why is the status changing?"),
      "Figures do not match the appendix",
    );
    await user.click(screen.getByRole("button", { name: "Record status change" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      review_status: "rejected",
      reason: "Figures do not match the appendix",
    });
  });

  it("shows a readable error and a busy button while saving", () => {
    setup({ submitting: true, error: new Error("Network down") });
    expect(screen.getByRole("alert")).toHaveTextContent("Network down");
    expect(screen.getByRole("button", { name: "Record status change" })).toBeDisabled();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup();
    await expectNoAccessibilityViolations(container);
  });
});
