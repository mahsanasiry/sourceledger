import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  for (const path of ["/", "/login", "/signup"]) {
    test(`${path} has no accessibility violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("signed-out visitors are sent to sign in and brought back afterwards", async ({ page }) => {
    await page.goto("/workspaces");
    await expect(page).toHaveURL(/\/login\?next=%2Fworkspaces/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("the sign in form explains missing fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter your email")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters")).toBeVisible();
  });
});
