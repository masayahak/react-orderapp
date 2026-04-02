import { expect, test } from "@playwright/test";

import { adminLogin } from "./helpers/login";

// 同一ファイル内のテストが並列実行されると revalidatePath の相互干渉でダイアログが不安定になるためシリアル実行
test.describe.configure({ mode: "serial" });

test.describe("得意先マスタ", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("一覧が表示される", async ({ page }) => {
    await page.goto("/master/customer");
    await expect(
      page.locator("h1:has-text('得意先マスタメンテナンス')")
    ).toBeVisible();
    await expect(page.locator("th:has-text('得意先名')")).toBeVisible();
    await expect(page.locator("th:has-text('電話番号')")).toBeVisible();
  });

  test("キーワード検索", async ({ page }) => {
    await page.goto("/master/customer");
    await page.fill('input[name="q"]', "得意先_1");
    await page.click('button:has-text("検索")');
    await page.waitForLoadState("networkidle");
    await expect(page.locator("td:has-text('得意先_1')").first()).toBeVisible();
  });

  test("新規登録 → 保存 → 検索で存在確認", async ({ page }) => {
    const testName = `E2E得意先${Date.now()}`;

    await page.goto("/master/customer");
    await page.click('button:has-text("新規追加")');
    await expect(page.locator("text=得意先の新規登録")).toBeVisible();

    await page.fill('input[name="得意先名"]', testName);
    await page.fill('input[name="電話番号"]', "090-0000-0001");

    await page.click('button:has-text("保存する")');
    await expect(page.locator("text=得意先の新規登録")).not.toBeVisible({ timeout: 15000 });

    // 検索で新規登録した得意先を確認
    await page.fill('input[name="q"]', testName);
    await page.click('button:has-text("検索")');
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`td:has-text("${testName}")`)).toBeVisible({ timeout: 10000 });
  });

  test("編集 → 保存", async ({ page }) => {
    await page.goto("/master/customer");

    // 最初の行の編集ボタンをクリック
    await page.locator("tbody tr").first().locator("button").first().click();
    await expect(page.locator("text=得意先情報の修正")).toBeVisible();

    // 備考フィールドを更新
    const remark = `E2Eテスト更新 ${Date.now()}`;
    await page.fill('textarea[name="備考"], input[name="備考"]', remark);
    await page.click('button:has-text("保存する")');

    // ダイアログが閉じることを確認
    await expect(page.locator("text=得意先情報の修正")).not.toBeVisible({ timeout: 15000 });
  });

  test("削除 → 確認ダイアログ → 削除実行", async ({ page }) => {
    // 削除用のテストデータを先に作成
    const testName = `E2E削除${Date.now()}`;

    await page.goto("/master/customer");
    await page.click('button:has-text("新規追加")');
    await page.fill('input[name="得意先名"]', testName);
    await page.click('button:has-text("保存する")');
    await expect(page.locator("text=得意先の新規登録")).not.toBeVisible({ timeout: 15000 });

    // 作成したデータをキーワード検索して絞り込む
    await page.fill('input[name="q"]', testName);
    await page.click('button:has-text("検索")');
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`td:has-text("${testName}")`)).toBeVisible({ timeout: 10000 });

    // 編集ダイアログを開く
    await page.locator("tbody tr").first().locator("button").first().click();
    await expect(page.locator("text=得意先情報の修正")).toBeVisible();

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
