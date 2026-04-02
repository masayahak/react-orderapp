import { expect, test } from "@playwright/test";

import { adminLogin } from "./helpers/login";

// 同一ファイル内のテストが並列実行されると revalidatePath の相互干渉でダイアログが不安定になるためシリアル実行
test.describe.configure({ mode: "serial" });

test.describe("商品マスタ", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("一覧が表示される", async ({ page }) => {
    await page.goto("/master/product");
    await expect(
      page.locator("h1:has-text('商品マスタメンテナンス')")
    ).toBeVisible();
    await expect(page.locator("th:has-text('商品CD')")).toBeVisible();
    await expect(page.locator("th:has-text('商品名')")).toBeVisible();
    await expect(page.locator("th:has-text('単価')")).toBeVisible();
  });

  test("キーワード検索", async ({ page }) => {
    await page.goto("/master/product");
    await page.fill('input[name="q"]', "ザク");
    await page.click('button:has-text("検索")');
    await page.waitForLoadState("networkidle");
    await expect(page.locator("td:has-text('ザク')").first()).toBeVisible();
  });

  test("新規登録 → 保存 → 検索で存在確認", async ({ page }) => {
    const testCode = `TST-${Date.now()}`;
    const testName = `テスト商品 ${Date.now()}`;

    await page.goto("/master/product");
    await page.click('button:has-text("新規追加")');
    await expect(page.locator("text=商品の新規登録")).toBeVisible();

    await page.fill('input[name="商品CD"]', testCode);
    await page.fill('input[name="商品名"]', testName);
    await page.fill('input[name="単価"]', "1500");

    await page.click('button:has-text("保存する")');
    await expect(page.locator("text=商品の新規登録")).not.toBeVisible({ timeout: 15000 });

    // 検索で新規登録した商品を確認
    await page.fill('input[name="q"]', testCode);
    await page.click('button:has-text("検索")');
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`td:has-text("${testCode}")`)).toBeVisible({ timeout: 10000 });
  });

  test("編集 → 保存", async ({ page }) => {
    await page.goto("/master/product");

    // 最初の行の編集ボタンをクリック
    await page.locator("tbody tr").first().locator("button").first().click();
    await expect(page.locator("text=商品情報の修正")).toBeVisible();

    // 備考フィールドを更新
    const remark = `E2Eテスト更新 ${Date.now()}`;
    await page.fill('textarea[name="備考"], input[name="備考"]', remark);
    await page.click('button:has-text("保存する")');

    // ダイアログが閉じることを確認
    await expect(page.locator("text=商品情報の修正")).not.toBeVisible({ timeout: 15000 });
  });

  test("削除 → 確認ダイアログ → 削除実行", async ({ page }) => {
    // 削除用のテストデータを先に作成
    const testCode = `DEL-${Date.now()}`;
    const testName = `削除テスト ${Date.now()}`;

    await page.goto("/master/product");
    await page.click('button:has-text("新規追加")');
    await page.fill('input[name="商品CD"]', testCode);
    await page.fill('input[name="商品名"]', testName);
    await page.fill('input[name="単価"]', "100");
    await page.click('button:has-text("保存する")');
    await expect(page.locator("text=商品の新規登録")).not.toBeVisible({ timeout: 15000 });

    // 作成したデータをキーワード検索して絞り込む
    await page.fill('input[name="q"]', testCode);
    await page.click('button:has-text("検索")');
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`td:has-text("${testCode}")`)).toBeVisible({ timeout: 10000 });

    // 編集ダイアログを開く
    await page.locator("tbody tr").first().locator("button").first().click();
    await expect(page.locator("text=商品情報の修正")).toBeVisible();

    // 削除ボタンが表示されるまで明示的に待機してクリック
    const deleteButton = page.locator('[role="dialog"] button').filter({ hasText: /^削除$/ });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();
    await expect(page.locator("text=本当に削除しますか？")).toBeVisible();
    await page.click('button:has-text("削除実行")');

    // 削除後、確認ダイアログが閉じることを確認
    await expect(page.locator("text=本当に削除しますか？")).not.toBeVisible({ timeout: 10000 });
  });
});
