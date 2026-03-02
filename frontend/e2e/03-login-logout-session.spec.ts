import { test, expect } from "@playwright/test";
import { signup, login, logout, uniqueEmail } from "./helpers/auth";
import { DESIGN_TOKENS, expectBgColor, expectTextColor } from "./helpers/design";

const PASSWORD = "TestPass1!";

test.describe("US3: Login, Logout, and Session Expiry", () => {
  test("register then logout then login again", async ({ page }) => {
    const email = uniqueEmail("session");
    const name = "Session User";
    await signup(page, email, PASSWORD, name);
    await logout(page);

    await login(page, email, PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("header-user")).toContainText(name);
  });

  test("logout clears user from header", async ({ page }) => {
    const email = uniqueEmail("logout");
    await signup(page, email, PASSWORD, "Logout Test");
    await logout(page);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("header-user")).not.toBeVisible();
  });

  test("session expired message shown", async ({ page }) => {
    await page.goto("/login?reason=expired");
    await expect(page.getByText(/session.*expired/i)).toBeVisible();
  });

  test("design checkpoint: login page tokens", async ({ page }) => {
    await page.goto("/login");
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectTextColor(page, "body", DESIGN_TOKENS.textPrimary);
  });

  test("edge case: wrong password shows error", async ({ page }) => {
    const email = uniqueEmail("wrongpw");
    await signup(page, email, PASSWORD, "Wrong PW");
    await logout(page);

    await page.goto("/login");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill("WrongPassword1!");
    await page.getByTestId("login-submit").click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("edge case: unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
