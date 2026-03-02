import { test, expect } from "@playwright/test";
import { signup, uniqueEmail } from "./helpers/auth";
import { DESIGN_TOKENS, expectBgColor, expectFontFamily } from "./helpers/design";

const PASSWORD = "TestPass1!";

test.describe("US1: Registration and Profile", () => {
  test("register and redirect to dashboard with name in header", async ({ page }) => {
    const email = uniqueEmail("reg");
    const displayName = "Reg User " + Date.now();
    await signup(page, email, PASSWORD, displayName);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("header-user")).toContainText(displayName);
  });

  test("navigate to profile and see display name and email", async ({ page }) => {
    const email = uniqueEmail("profile");
    const displayName = "Profile User";
    await signup(page, email, PASSWORD, displayName);
    await page.getByRole("link", { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByTestId("profile-display-name")).toContainText(displayName);
    await expect(page.getByTestId("profile-email")).toContainText(email);
  });

  test("design checkpoint: profile page tokens", async ({ page }) => {
    await signup(page, uniqueEmail("design-reg"), PASSWORD, "Design Check");
    await page.goto("/profile");
    await expectBgColor(page, "body", DESIGN_TOKENS.bgPrimary);
    await expectFontFamily(page, "body", DESIGN_TOKENS.fontBody);
  });

  test("edge case: duplicate email shows error", async ({ page }) => {
    const dupEmail = uniqueEmail("dup");
    await signup(page, dupEmail, PASSWORD, "First User");
    await page.getByTestId("header-logout").click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/signup");
    await page.getByTestId("signup-display-name").fill("Duplicate");
    await page.getByTestId("signup-email").fill(dupEmail);
    await page.getByTestId("signup-password").fill(PASSWORD);
    await page.getByTestId("signup-submit").click();

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/signup/);
  });
});
