import { test, expect } from "@playwright/test";
import { signup, login, logout, uniqueEmail } from "./helpers/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD, assignBuyerRole } from "./helpers/admin";
import {
  DESIGN_TOKENS,
  expectBgColor,
  expectFontFamily,
  expectTextColor,
} from "./helpers/design";

const PASSWORD = "TestPass1!";

test.describe("US6: Design Compliance — all pages", () => {
  let buyerEmail: string;
  let campaignUrl: string;

  test.beforeAll(async ({ browser }) => {
    buyerEmail = uniqueEmail("design");
    const page = await browser.newPage();

    await signup(page, buyerEmail, PASSWORD, "Design User");
    await logout(page);
    await assignBuyerRole(page, buyerEmail);
    await login(page, buyerEmail, PASSWORD);

    await page.goto("/campaigns/new");
    await page.getByLabel("Name").fill(`Design Campaign ${Date.now()}`);
    await page.getByLabel("Budget").fill("100");
    await page.getByLabel("Status").selectOption("active");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]+/, { timeout: 10_000 });
    campaignUrl = page.url();

    await logout(page);
    await page.close();
  });

  test("landing page (/)", async ({ page }) => {
    await page.goto("/");
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectFontFamily(page, "h1", DESIGN_TOKENS.fontDisplay);
    await expectFontFamily(page, "body", DESIGN_TOKENS.fontBody);
  });

  test("login page (/login)", async ({ page }) => {
    await page.goto("/login");
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectTextColor(page, "body", DESIGN_TOKENS.textPrimary);
  });

  test("signup page (/signup)", async ({ page }) => {
    await page.goto("/signup");
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectTextColor(page, "body", DESIGN_TOKENS.textPrimary);
  });

  test("dashboard (/dashboard)", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectFontFamily(page, "h1", DESIGN_TOKENS.fontDisplay);
  });

  test("profile (/profile)", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/profile");
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectFontFamily(page, "body", DESIGN_TOKENS.fontBody);
  });

  test("campaigns listing (/campaigns)", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns");
    await expect(page.getByTestId("campaign-table")).toBeVisible({ timeout: 10_000 });
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectFontFamily(page, "body", DESIGN_TOKENS.fontBody);
  });

  test("campaign new (/campaigns/new)", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    await page.goto("/campaigns/new");
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
  });

  test("campaign edit (/campaigns/:id)", async ({ page }) => {
    await login(page, buyerEmail, PASSWORD);
    const path = new URL(campaignUrl).pathname;
    await page.goto(path);
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
  });

  test("admin page (/admin)", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin");
    await expect(page.getByTestId("admin-user-list")).toBeVisible();
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectFontFamily(page, "h1", DESIGN_TOKENS.fontDisplay);
  });
});
