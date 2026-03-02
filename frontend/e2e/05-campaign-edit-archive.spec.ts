import { test, expect } from "@playwright/test";
import { signup, login, logout, uniqueEmail } from "./helpers/auth";
import { assignBuyerRole } from "./helpers/admin";
import { DESIGN_TOKENS, expectBgColor } from "./helpers/design";

const PASSWORD = "TestPass1!";

test.describe("US5: Campaign Edit and Archive", () => {
  let buyerEmail: string;
  let campaignName: string;

  test.beforeAll(async ({ browser }) => {
    buyerEmail = uniqueEmail("edit-buyer");
    campaignName = `Editable ${Date.now()}`;
    const page = await browser.newPage();

    await signup(page, buyerEmail, PASSWORD, "Edit Buyer");
    await logout(page);
    await assignBuyerRole(page, buyerEmail);
    await login(page, buyerEmail, PASSWORD);

    await page.goto("/campaigns/new");
    await page.getByLabel("Name").fill(campaignName);
    await page.getByLabel("Budget").fill("300");
    await page.getByLabel("Status").selectOption("active");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]+/, { timeout: 10_000 });

    await page.close();
  });

  test("edit campaign name and save", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");
    const row = page.getByRole("row", { name: new RegExp(campaignName) });
    await row.getByRole("link", { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]+/);

    const updatedName = `${campaignName} Updated`;
    await page.getByLabel("Name").fill(updatedName);
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByLabel("Name")).toHaveValue(updatedName, {
      timeout: 5_000,
    });
    campaignName = updatedName;
  });

  test("updated name visible in listing", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");
    await expect(page.getByText(campaignName)).toBeVisible({ timeout: 10_000 });
  });

  test("archive campaign from listing", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");

    page.on("dialog", (d) => d.accept());

    const row = page.getByRole("row", { name: new RegExp(campaignName) });
    await row.getByRole("button", { name: /archive/i }).click();

    await page.waitForTimeout(1000);
    await page.reload();
    await expect(page.getByTestId("campaign-table")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/archive/i)).toBeVisible({ timeout: 5_000 });
  });

  test("archived campaign is view-only", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");
    const row = page.getByRole("row", { name: new RegExp(campaignName) });
    await row.getByRole("link", { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]+/);

    await expect(page.getByTestId("archived-notice")).toBeVisible();
    await expect(page.getByLabel("Name")).toBeDisabled();
    await expect(page.getByRole("button", { name: /save/i })).not.toBeVisible();
  });

  test("design checkpoint: edit page tokens", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");
    const row = page.getByRole("row", { name: new RegExp(campaignName) });
    await row.getByRole("link", { name: /edit/i }).click();
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
  });
});
