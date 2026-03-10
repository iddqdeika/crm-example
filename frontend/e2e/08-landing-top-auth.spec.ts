import { test, expect } from "@playwright/test";

/**
 * E2E: Landing page top-area Sign up / Sign in (feature 015).
 * Visitor sees Sign up and Sign in in the header without scrolling; single click navigates to correct flow.
 */
test.describe("Landing top auth (visitor)", () => {
  test("visitor sees Sign up and Sign in in top area; click Sign up → signup page", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.getByTestId("app-header");
    const signUp = header.getByRole("link", { name: /sign up/i });
    const signIn = header.getByRole("link", { name: /sign in/i });
    await expect(signUp).toBeVisible({ timeout: 5_000 });
    await expect(signIn).toBeVisible({ timeout: 5_000 });

    await signUp.click();
    await expect(page).toHaveURL(/\/signup/, { timeout: 5_000 });
  });

  test("visitor sees Sign up and Sign in in top area; click Sign in → login page", async ({
    page,
  }) => {
    await page.goto("/");
    const header = page.getByTestId("app-header");
    const signIn = header.getByRole("link", { name: /sign in/i });
    await expect(signIn).toBeVisible({ timeout: 5_000 });

    await signIn.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
