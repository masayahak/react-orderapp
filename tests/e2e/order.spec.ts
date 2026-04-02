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
    await expect(page.getByRole("button", { name: "新規受注" })).toBeVisible();
  });

  test("新規受注登録 → 登録成功", async ({ page }) => {
    await page.goto("/order/new");
    await expect(page.locator("text=受注起票").first()).toBeVisible();

    // 得意先を選択
    await page.click('button[role="combobox"]:has-text("得意先を検索...")');
    await page.fill('[placeholder="検索キーワードを入力..."]', "TEST得意先");
    const customerItem = page
      .locator('[cmdk-item], [role="option"]')
      .filter({ hasText: "TEST得意先" })
      .first();
    await expect(customerItem).toBeVisible({ timeout: 5000 });
    // .click() ではなく .dispatchEvent('click') を使う
    await customerItem.dispatchEvent("click");
    await expect(
      page
        .locator('button[role="combobox"]')
        .filter({ hasText: /TEST得意先|得意先を検索.../ }),
    ).toContainText("TEST得意先");

    // 商品選択（"ザク" はDBに存在確認済み）
    await page.click('button[role="combobox"]:has-text("CD検索...")');
    await page.fill('[placeholder="検索キーワードを入力..."]', "ザク");
    // "ザク" を含む項目が表示されるまで待機（初期の全件リストと区別するため）
    const productItem = page
      .locator('[role="option"], [cmdk-item]')
      .filter({ hasText: "ザク" })
      .first();
    await expect(productItem).toBeVisible({ timeout: 5000 });
    await productItem.click();
    await expect(page.locator("[cmdk-list]")).not.toBeVisible();

    // 数量入力
    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill("3");

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
    const searchBtn = page.getByRole("button", { name: "検索" });
    await expect(searchBtn).toBeEnabled();
    await searchBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("th:has-text('受注ID')")).toBeVisible();
  });
});
