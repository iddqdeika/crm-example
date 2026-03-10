import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers/admin";

/**
 * E2E: Dashboard role-based counts (feature 016).
 * Buyer sees campaigns count; content_manager sees drafts + published; admin sees all four.
 */
test.describe("Dashboard counts (016)", () => {
  test("admin sees dashboard counts section after login", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("dashboard-counts")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Campaigns")).toBeVisible();
    await expect(page.getByText("Drafts")).toBeVisible();
    await expect(page.getByText("Published")).toBeVisible();
    await expect(page.getByText("Users")).toBeVisible();
  });
});
