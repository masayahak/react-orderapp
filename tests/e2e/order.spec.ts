import { expect, test } from "@playwright/test";

import { login } from "./helpers/login";

test.describe("受注管理", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("受注一覧が表示される", async ({ page }) => {
    await page.goto("/order");
    await expect(page.locator("th:has-text('受注ID')")).toBeVisible();
    await expect(page.locator("th:has-text('得意先名')")).toBeVisible();
    await expect(page.locator("th:has-text('合計金額')")).toBeVisible();
    await expect(page.locator('button:has-text("新規受注")')).toBeVisible();
  });

  test("新規受注登録 → 登録成功", async ({ page }) => {
    await page.goto("/order/new");
    await expect(page.locator("text=受注起票").first()).toBeVisible();

    // 得意先選択
    await page.click('button[role="combobox"]:has-text("得意先を検索...")');
    await page.fill('[placeholder="検索キーワードを入力..."]', "E2E得意先");
    // "E2E得意先" を含む項目が表示されるまで待機（初期の全件リストと区別するため）
    const customerItem = page
      .locator('[data-state="open"] [cmdk-item]')
      .filter({ hasText: "E2E得意先" })
      .first();
    await customerItem.waitFor({ state: "visible", timeout: 15000 });
    await customerItem.click();
    await expect(
      page.locator('button[role="combobox"]:has-text("得意先を検索...")'),
    ).toHaveCount(0, { timeout: 5000 });

    // 商品選択（"ザク" はDBに存在確認済み）
    await page.click('button[role="combobox"]:has-text("CD検索...")');
    await page.fill('[placeholder="検索キーワードを入力..."]', "ザク");
    // "ザク" を含む項目が表示されるまで待機（初期の全件リストと区別するため）
    await page.waitForTimeout(1000);
    const productItem = page
      .locator('[role="option"], [cmdk-item]')
      .filter({ hasText: "ザク" })
      .first();
    await productItem.click();
    await expect(page.locator("[cmdk-list]")).not.toBeVisible();

    // 数量入力
    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill("3");
    await page.waitForTimeout(500);

    const submitBtn = page.locator(
      'button[type="submit"]:has-text("受注を確定する")',
    );
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await expect(page.getByText("受注を登録しました")).toBeVisible({
      timeout: 10000,
    });
  });

  test("バリデーション: 得意先未選択で送信 → フォームに留まる", async ({
    page,
  }) => {
    await page.goto("/order/new");
    await page.click('button[type="submit"]:has-text("受注を確定する")');
    // バリデーションエラーでフォームページに留まることを確認
    await expect(page).toHaveURL(/.*\/order\/new/);
  });

  test("受注一覧の検索機能", async ({ page }) => {
    await page.goto("/order");
    await page.fill('input[name="q"]', "テスト");
    await page.click('button:has-text("検索")');
    await page.waitForLoadState("networkidle");
    await expect(page.locator("th:has-text('受注ID')")).toBeVisible();
  });
});
