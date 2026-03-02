import { test, expect } from "@playwright/test";
import { signup, login, uniqueEmail } from "./helpers/auth";
import { assignBuyerRole } from "./helpers/admin";
import { DESIGN_TOKENS, expectBgColor, expectFontFamily } from "./helpers/design";

const PASSWORD = "TestPass1!";

test.describe("US2: Campaign Creation and Listing", () => {
  let buyerEmail: string;
  const displayName = `Buyer ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    buyerEmail = uniqueEmail("buyer");
    const page = await browser.newPage();
    await signup(page, buyerEmail, PASSWORD, displayName);
    await page.getByTestId("header-logout").click();
    await expect(page).toHaveURL(/\/login/);
    await assignBuyerRole(page, buyerEmail);
    await page.close();
  });

  test("campaigns listing loads with table visible", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");
    await expect(page.getByTestId("campaign-table")).toBeVisible({ timeout: 10_000 });
  });

  test("create campaign → redirected to edit page with name in heading", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");

    const campaignName = `E2E Campaign ${Date.now()}`;
    await page.getByRole("link", { name: /create campaign/i }).click();
    await expect(page).toHaveURL(/\/campaigns\/new/);

    await page.getByLabel("Name").fill(campaignName);
    await page.getByLabel("Budget").fill("500");
    await page.getByLabel("Status").selectOption("active");
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]+/, { timeout: 10_000 });
    await expect(page.getByLabel("Name")).toHaveValue(campaignName);
  });

  test("new campaign visible in listing after creation", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");

    const campaignName = `List Check ${Date.now()}`;
    await page.getByRole("link", { name: /create campaign/i }).click();
    await page.getByLabel("Name").fill(campaignName);
    await page.getByLabel("Budget").fill("250");
    await page.getByLabel("Status").selectOption("active");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]+/, { timeout: 10_000 });

    await page.goto("/campaigns");
    await expect(page.getByTestId("campaign-table")).toBeVisible();
    await expect(page.getByText(campaignName)).toBeVisible();
  });

  test("design checkpoint: campaigns listing tokens", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");
    await expect(page.getByTestId("campaign-table")).toBeVisible({ timeout: 10_000 });
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectFontFamily(page, "body", DESIGN_TOKENS.fontBody);
  });

  test("edge case: empty campaign name prevents submission", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns/new");
    await page.getByLabel("Budget").fill("100");
    await page.getByLabel("Status").selectOption("active");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/campaigns\/new/);
  });
});
