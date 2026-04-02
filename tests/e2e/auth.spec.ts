import { expect, test } from "@playwright/test";

test.describe("認証フロー", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("ログイン成功 → ダッシュボードへリダイレクト", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "kyouhayuki");
    await page.click('button[type="submit"]:has-text("ログイン")');
    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test("ログイン失敗 → ログインページに留まる", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]:has-text("ログイン")');
    // エラー後、送信ボタンが再び有効になるまで待機（isLoading=falseになる）
    await expect(
      page.locator('button[type="submit"]')
    ).toBeEnabled({ timeout: 20000 });
    // ログインページに留まることを確認
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
    await page.click('button[type="submit"]:has-text("ログイン")');
    await page.waitForURL("**/dashboard");

    await page.click('button:has-text("ログアウト")');
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/.*\/login/);
  });
});
