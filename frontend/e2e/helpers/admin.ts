import { type Page, expect } from "@playwright/test";
import { login, logout } from "./auth";

export const ADMIN_EMAIL = "admin@e2e-admin.example.com";
export const ADMIN_PASSWORD = "AdminPass1!";

export async function assignBuyerRole(
  page: Page,
  targetEmail: string,
): Promise<void> {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await page.getByTestId("header-admin-link").click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
  await expect(page.getByTestId("admin-user-list")).toBeVisible();

  const userButton = page.getByRole("button", { name: new RegExp(targetEmail) });
  await userButton.click();
  await expect(page.getByTestId("admin-user-detail")).toBeVisible();

  await page.getByTestId("admin-edit-role").selectOption("buyer");
  await page.getByTestId("admin-save").click();

  await expect(page.getByTestId("admin-user-detail")).not.toBeVisible({
    timeout: 5_000,
  });

  await logout(page);
}
