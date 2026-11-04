import axe from "axe-core";
import { expect } from "vitest";

export async function expectNoAccessibilityViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  const summary = results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(" | ")}`,
  );
  expect(summary).toEqual([]);
}
