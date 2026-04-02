import { expect, test } from "@playwright/test";

test.describe("認証フロー", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("ログイン成功 → ダッシュボードへリダイレクト", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "kyouhayuki");
    const submitBtn = page.getByRole("button", { name: "ログイン" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test("ログイン失敗 → ログインページに留まる", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "wrongpassword");

    const submitBtn = page.getByRole("button", { name: "ログイン" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    // onError で setIsLoading(false) が呼ばれ、ボタンが再有効化されることを確認
    await expect(submitBtn).toBeEnabled({ timeout: 20000 });
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("未認証でprotectedページアクセス → /loginへリダイレクト", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("ログアウト → /loginへリダイレクト", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "kyouhayuki");
    const submitBtn = page.getByRole("button", { name: "ログイン" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await page.waitForURL("**/dashboard");

    const logoutBtn = page.getByRole("button", { name: "ログアウト" });
    await expect(logoutBtn).toBeEnabled();
    await logoutBtn.click();
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/.*\/login/);
  });
});
