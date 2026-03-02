import { type Page, expect } from "@playwright/test";

export async function signup(
  page: Page,
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  await page.goto("/signup");
  await page.getByTestId("signup-display-name").fill(displayName);
  await page.getByTestId("signup-email").fill(email);
  await page.getByTestId("signup-password").fill(password);
  await page.getByTestId("signup-submit").click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

export async function logout(page: Page): Promise<void> {
  await page.getByTestId("header-logout").click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
}

export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}
