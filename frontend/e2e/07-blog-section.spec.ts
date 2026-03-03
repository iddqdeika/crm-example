import { test, expect } from "@playwright/test";
import { signup, login, logout, uniqueEmail } from "./helpers/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers/admin";
import { login as adminLogin } from "./helpers/auth";

const PASSWORD = "TestPass1!";
const RUN_ID = Date.now().toString(36);

function uniqueTitle(prefix: string) {
  return `${prefix} ${RUN_ID}`;
}

// ---------------------------------------------------------------------------
// Helper: assign content_manager role via admin panel
// ---------------------------------------------------------------------------
async function assignContentManagerRole(page: import("@playwright/test").Page, targetEmail: string) {
  await adminLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.getByTestId("header-admin-link").click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
  const userButton = page.getByRole("button", { name: new RegExp(targetEmail) });
  await userButton.click();
  await expect(page.getByTestId("admin-user-detail")).toBeVisible();
  await page.getByTestId("admin-edit-role").selectOption("content_manager");
  await page.getByTestId("admin-save").click();
  await expect(page.getByTestId("admin-user-detail")).not.toBeVisible({ timeout: 5_000 });
  await logout(page);
}

// ---------------------------------------------------------------------------
// Helper: create and publish a blog post, return its title
// ---------------------------------------------------------------------------
async function createAndPublishPost(
  page: import("@playwright/test").Page,
  title: string,
  body: string,
) {
  await page.goto("/blog/manage/new");
  await page.locator("#post-title").fill(title);
  await page.locator(".tiptap").click();
  await page.locator(".tiptap").fill(body);
  await page.getByTestId("publish-post-btn").click();
  // Must land on /blog/manage (NOT /blog/manage/new which means creation failed)
  await expect(page).toHaveURL(/\/blog\/manage$/, { timeout: 10_000 });
  await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
}

test.describe("US5: Blog Section", () => {
  test.describe.configure({ mode: "serial" });
  let cmEmail: string;

  test.beforeAll(async ({ browser }) => {
    cmEmail = uniqueEmail("cm");
    const page = await browser.newPage();
    await signup(page, cmEmail, PASSWORD, `CM ${Date.now()}`);
    await page.getByTestId("header-logout").click();
    await expect(page).toHaveURL(/\/login/);
    await assignContentManagerRole(page, cmEmail);
    await page.close();
  });

  // -------------------------------------------------------------------------
  // E35: Landing page shows blog section without login
  // -------------------------------------------------------------------------
  test("E35: landing page shows blog section with posts after creation", async ({ page }) => {
    const title = uniqueTitle("E35 Post");
    await login(page, cmEmail, PASSWORD);
    await createAndPublishPost(page, title, "E35 body content for landing test");
    await logout(page);

    // Verify post appears on public /blog listing
    await page.goto("/blog");
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });

    // Verify the landing page renders a blog section (don't look for the
    // specific title — the landing page only shows 3 latest posts, so on a
    // dirty DB the newly created post might not be in the top 3).
    await page.goto("/");
    await expect(page.getByTestId("landing-blog-section")).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // E36: content-manager creates post → visible on /blog
  // -------------------------------------------------------------------------
  test("E36: content-manager creates post → visible on /blog", async ({ page }) => {
    const title = uniqueTitle("E36 Public");
    await login(page, cmEmail, PASSWORD);
    await createAndPublishPost(page, title, "E36 body text");

    await page.goto("/blog");
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // E37: content-manager edits post → updated on public blog
  // -------------------------------------------------------------------------
  test("E37: content-manager edits post → updated content visible publicly", async ({ page }) => {
    const originalTitle = uniqueTitle("E37 Original");
    const updatedTitle = uniqueTitle("E37 Updated");

    await login(page, cmEmail, PASSWORD);
    await createAndPublishPost(page, originalTitle, "E37 original body");

    // Find the post row in the manage table and click its Edit button
    const row = page.locator("tr", { hasText: originalTitle });
    await row.getByRole("button", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/blog\/manage\/[0-9a-f-]+/, { timeout: 10_000 });

    await page.locator("#post-title").clear();
    await page.locator("#post-title").fill(updatedTitle);
    await page.getByTestId("publish-post-btn").click();
    await expect(page).toHaveURL(/\/blog\/manage$/, { timeout: 10_000 });

    // Verify updated title on public /blog
    await page.goto("/blog");
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // E38: content-manager deletes post → removed from /blog
  // -------------------------------------------------------------------------
  test("E38: content-manager deletes post → removed from /blog", async ({ page }) => {
    const title = uniqueTitle("E38 ToDelete");

    await login(page, cmEmail, PASSWORD);
    await createAndPublishPost(page, title, "E38 delete body");

    // Find the post row in the manage table and click its Delete button
    const row = page.locator("tr", { hasText: title });
    await row.getByRole("button", { name: "Delete" }).click();
    await page.getByTestId("confirm-delete").click();

    // Verify removed from /blog
    await page.goto("/blog");
    await expect(page.getByText(title)).not.toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // E39: Search on /blog returns highlighted results
  // -------------------------------------------------------------------------
  test("E39: search on /blog returns highlighted results", async ({ page }) => {
    const title = uniqueTitle("E39 Searchable");

    await login(page, cmEmail, PASSWORD);
    await createAndPublishPost(page, title, "meilisearch highlight integration test");
    await logout(page);

    await page.goto("/blog");
    const searchInput = page.getByRole("searchbox");
    await searchInput.fill(title);
    await expect(page.getByText(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeVisible({ timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // E40: content-manager cannot access /campaigns
  // -------------------------------------------------------------------------
  test("E40: content-manager cannot access /campaigns", async ({ page }) => {
    await login(page, cmEmail, PASSWORD);
    await page.goto("/campaigns");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5_000 });
    await expect(page.getByTestId("header-blog-link")).toBeVisible();
    await expect(page.getByTestId("header-campaigns-link")).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // E41: admin can create and manage blog posts
  // -------------------------------------------------------------------------
  test("E41: admin can create and manage blog posts", async ({ page }) => {
    const title = uniqueTitle("E41 AdminPost");
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await createAndPublishPost(page, title, "Admin authored content");
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });
  });

  // -------------------------------------------------------------------------
  // E42: Post detail shows "last updated" only after edit
  // -------------------------------------------------------------------------
  test("E42: post detail shows last updated only after edit", async ({ page }) => {
    const title = uniqueTitle("E42 Indicator");
    const editedTitle = uniqueTitle("E42 Indicator Edited");

    await login(page, cmEmail, PASSWORD);
    await createAndPublishPost(page, title, "E42 body");

    // Open the post detail from /blog
    await page.goto("/blog");
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
    await page.getByText(title).first().click();
    await expect(page).toHaveURL(/\/blog\/post\/.+/, { timeout: 5_000 });
    await expect(page.getByText(/last updated/i)).not.toBeVisible();

    // Go back to manage page, find the post row and edit it
    await page.goto("/blog/manage");
    const row = page.locator("tr", { hasText: title });
    await row.getByRole("button", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/blog\/manage\/[0-9a-f-]+/, { timeout: 10_000 });

    await page.locator("#post-title").clear();
    await page.locator("#post-title").fill(editedTitle);
    await page.getByTestId("publish-post-btn").click();
    await expect(page).toHaveURL(/\/blog\/manage$/, { timeout: 10_000 });

    // Reopen post and check "last updated" appears
    await page.goto("/blog");
    await expect(page.getByText(editedTitle)).toBeVisible({ timeout: 15_000 });
    await page.getByText(editedTitle).first().click();
    await expect(page).toHaveURL(/\/blog\/post\/.+/, { timeout: 5_000 });
    await expect(page.getByText(/last updated/i)).toBeVisible({ timeout: 5_000 });
  });

  // -------------------------------------------------------------------------
  // E43: Unauthenticated user sees Log in/Register on blog; login from post redirects back to post
  // -------------------------------------------------------------------------
  test("E43: unauthenticated sees Log in and Register on blog; login from post redirects back to same post", async ({
    page,
  }) => {
    const title = uniqueTitle("E43 Auth Links");
    await login(page, cmEmail, PASSWORD);
    await createAndPublishPost(page, title, "E43 body for auth links test");
    await logout(page);

    // As unauthenticated: /blog shows Log in and Register
    await page.goto("/blog");
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("link", { name: /register/i })).toBeVisible({ timeout: 5_000 });

    // Open a post, then click Log in (should set redirectAfterLogin to this post)
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
    await page.getByText(title).first().click();
    await expect(page).toHaveURL(/\/blog\/post\/.+/, { timeout: 5_000 });

    await page.getByRole("link", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

    await page.getByTestId("login-email").fill(cmEmail);
    await page.getByTestId("login-password").fill(PASSWORD);
    await page.getByTestId("login-submit").click();

    // Should redirect back to the same blog post (not dashboard)
    await expect(page).toHaveURL(/\/blog\/post\//, { timeout: 10_000 });
    await expect(page.getByText(title)).toBeVisible({ timeout: 5_000 });
  });
});
