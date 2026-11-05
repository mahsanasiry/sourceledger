import AxeBuilder from "@axe-core/playwright";
import { expect as baseExpect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

// The first visit to a route is slow while the development server compiles it.
const expect = baseExpect.configure({ timeout: 20_000 });

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.skip(
  !email || !password,
  "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run the signed-in journey",
);

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email ?? "");
  await page.getByLabel("Password").fill(password ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();

  const rejection = page.locator("form").getByRole("alert");
  await Promise.race([page.waitForURL(/\/workspaces$/), rejection.waitFor()]);
  if (await rejection.isVisible()) {
    throw new Error(`Sign in was rejected: ${await rejection.textContent()}`);
  }
}

test("record a source, review it, and find it again from the url", async ({ page }) => {
  test.setTimeout(180_000);

  const stamp = Date.now();
  const title = `Council meeting minutes ${stamp}`;

  await signIn(page);

  await page.getByRole("button", { name: "New workspace" }).first().click();
  await page.getByLabel("Name").fill(`Journey ${stamp}`);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page.getByRole("heading", { name: `Journey ${stamp}`, level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "New claim" }).first().click();
  await page
    .getByLabel("Claim or research question")
    .fill("The new tram line raised footfall on Market Street");
  await page.getByRole("button", { name: "Create claim" }).click();
  await page.waitForURL(/\/claims\//, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /new tram line/ })).toBeVisible();
  await expect(page.getByText("No sources linked yet")).toBeVisible();

  await page.getByRole("button", { name: "Add source" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Address", { exact: true }).fill("https://example.org/minutes");
  await dialog.getByLabel("Title", { exact: true }).fill(title);
  await dialog
    .getByLabel("What the source says", { exact: true })
    .fill("Footfall counts fell 4 percent in the first quarter.");
  await dialog.getByLabel("Relation", { exact: true }).selectOption("contradicts");
  await dialog.getByRole("button", { name: "Add source" }).click();

  const contradicts = page.getByRole("region", { name: /Contradicts/ });
  await expect(contradicts.getByText(title)).toBeVisible();
  await expect(page.getByRole("complementary")).toContainText("Footfall counts fell 4 percent");

  const panel = page.getByRole("complementary");
  await panel.getByLabel("Review status").selectOption("verified");
  await panel.getByRole("button", { name: "Record status change" }).click();
  await expect(page.getByText("Say why the status is changing")).toBeVisible();
  await panel.getByLabel("Why is the status changing?").fill("Matches the published minutes");
  await panel.getByRole("button", { name: "Record status change" }).click();
  await expect(panel.getByText("Matches the published minutes")).toBeVisible();

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);

  await page.getByLabel("Search sources").fill("minutes");
  await expect(page).toHaveURL(/q=minutes/);
  const filters = page.getByRole("region", { name: "Search and filter sources" });
  await filters.getByLabel("Review status").selectOption("verified");
  await expect(page).toHaveURL(/review=verified/);

  await page.reload();
  await expect(page.getByLabel("Search sources")).toHaveValue("minutes");
  await expect(contradicts.getByText(title)).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/review=verified/);
  await expect(filters.getByLabel("Review status")).toHaveValue("");
  await page.goForward();
  await expect(page).toHaveURL(/review=verified/);

  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByText(/Added source: Council meeting minutes/)).toBeVisible();

  await page.getByRole("link", { name: "Graph" }).click();
  await expect(page.getByLabel("Evidence graph")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export JSON" }).click(),
  ]);
  const exported = JSON.parse(await readFile(await download.path(), "utf8")) as {
    sources: { title: string }[];
  };
  expect(exported.sources.map((source) => source.title)).toContain(title);

  await page.getByRole("button", { name: "Delete" }).first().click();
  await page.getByRole("button", { name: "Delete workspace" }).click();
  await expect(page).toHaveURL(/\/workspaces$/);
});
