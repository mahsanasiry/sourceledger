import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

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
  await expect(page).toHaveURL(/\/workspaces$/);
}

test("record a source, review it, and find it again from the url", async ({ page }) => {
  const stamp = Date.now();
  const title = `Council meeting minutes ${stamp}`;

  await signIn(page);

  await page.getByRole("button", { name: "New workspace" }).click();
  await page.getByLabel("Name").fill(`Journey ${stamp}`);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page.getByRole("heading", { name: `Journey ${stamp}`, level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "New claim" }).first().click();
  await page
    .getByLabel("Claim or research question")
    .fill("The new tram line raised footfall on Market Street");
  await page.getByRole("button", { name: "Create claim" }).click();
  await expect(page.getByRole("heading", { name: /new tram line/ })).toBeVisible();
  await expect(page.getByText("No sources linked yet")).toBeVisible();

  await page.getByRole("button", { name: "Add source" }).first().click();
  await page.getByLabel("Address").fill("https://example.org/minutes");
  await page.getByLabel("Title").fill(title);
  await page
    .getByLabel("What the source says")
    .fill("Footfall counts fell 4 percent in the first quarter.");
  await page.getByLabel("Relation").selectOption("contradicts");
  await page.getByRole("button", { name: "Add source" }).last().click();

  const contradicts = page.getByRole("region", { name: /Contradicts/ });
  await expect(contradicts.getByText(title)).toBeVisible();
  await expect(page.getByRole("complementary")).toContainText("Footfall counts fell 4 percent");

  await page.getByLabel("Review status").selectOption("verified");
  await page.getByRole("button", { name: "Record status change" }).click();
  await expect(page.getByText("Say why the status is changing")).toBeVisible();
  await page.getByLabel("Why is the status changing?").fill("Matches the published minutes");
  await page.getByRole("button", { name: "Record status change" }).click();
  await expect(
    page.getByRole("complementary").getByText("Matches the published minutes"),
  ).toBeVisible();

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);

  await page.getByLabel("Search sources").fill("minutes");
  await expect(page).toHaveURL(/q=minutes/);
  await page.getByLabel("Review status").first().selectOption("verified");
  await expect(page).toHaveURL(/review=verified/);

  await page.reload();
  await expect(page.getByLabel("Search sources")).toHaveValue("minutes");
  await expect(contradicts.getByText(title)).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/review=verified/);
  await expect(page.getByLabel("Review status").first()).toHaveValue("");
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
