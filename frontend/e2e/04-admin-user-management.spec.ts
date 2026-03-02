import { test, expect } from "@playwright/test";
import { signup, login, logout, uniqueEmail } from "./helpers/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers/admin";
import { DESIGN_TOKENS, expectBgColor, expectFontFamily } from "./helpers/design";

const PASSWORD = "TestPass1!";

test.describe("US4: Admin User Management", () => {
  test("admin sees Admin link and user list", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page.getByTestId("header-admin-link")).toBeVisible();
    await page.getByTestId("header-admin-link").click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByTestId("admin-user-list")).toBeVisible();
  });

  test("admin can change user role to buyer", async ({ page }) => {
    const targetEmail = uniqueEmail("role-target");
    await signup(page, targetEmail, PASSWORD, "Role Target");
    await logout(page);

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin");
    await expect(page.getByTestId("admin-user-list")).toBeVisible();

    await page.getByRole("button", { name: new RegExp(targetEmail) }).click();
    await expect(page.getByTestId("admin-user-detail")).toBeVisible();
    await page.getByTestId("admin-edit-role").selectOption("buyer");
    await page.getByTestId("admin-save").click();
    await expect(page.getByTestId("admin-user-detail")).not.toBeVisible({ timeout: 5_000 });

    await expect(page.getByRole("button", { name: new RegExp(targetEmail) })).toContainText("buyer");
  });

  test("design checkpoint: admin page tokens", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin");
    await expect(page.getByTestId("admin-user-list")).toBeVisible();
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectFontFamily(page, "h1", DESIGN_TOKENS.fontDisplay);
  });

  test("edge case: non-admin redirected from /admin to /dashboard", async ({ page }) => {
    const email = uniqueEmail("nonadmin");
    await signup(page, email, PASSWORD, "Non-Admin");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });
});
