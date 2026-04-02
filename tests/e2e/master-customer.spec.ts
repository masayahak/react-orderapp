import { expect, test } from "@playwright/test";

import { adminLogin } from "./helpers/login";

// 同一ファイル内のテストが並列実行されると revalidatePath の相互干渉でダイアログが不安定になるためシリアル実行
test.describe.configure({ mode: "serial" });

const createdCustomerNames: string[] = [];

test.describe("得意先マスタ", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("一覧が表示される", async ({ page }) => {
    await page.goto("/master/customer");
    await expect(
      page.locator("h1:has-text('得意先マスタメンテナンス')"),
    ).toBeVisible();
    await expect(page.locator("th:has-text('得意先名')")).toBeVisible();
    await expect(page.locator("th:has-text('電話番号')")).toBeVisible();
  });

  test("キーワード検索", async ({ page }) => {
    await page.goto("/master/customer");
    await page.fill('input[name="q"]', "得意先_1");
    const searchBtn = page.getByRole("button", { name: "検索" });
    await expect(searchBtn).toBeEnabled();
    await searchBtn.dispatchEvent("click");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("td:has-text('得意先_1')").first()).toBeVisible();
  });

  test("新規登録 → 保存 → 検索で存在確認", async ({ page }) => {
    const testName = `E2E得意先${Date.now()}`;
    createdCustomerNames.push(testName);

    await page.goto("/master/customer");
    const newBtn = page.getByRole("button", { name: "新規追加" });
    await expect(newBtn).toBeEnabled();
    await newBtn.dispatchEvent("click");
    await expect(page.locator("text=得意先の新規登録")).toBeVisible();

    await page.fill('input[name="得意先名"]', testName);
    await page.fill('input[name="電話番号"]', "090-0000-0001");

    const saveBtn = page.getByRole("button", { name: "保存する" });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.dispatchEvent("click");
    await expect(page.locator("text=得意先の新規登録")).not.toBeVisible({
      timeout: 15000,
    });

    // 検索で新規登録した得意先を確認
    await page.fill('input[name="q"]', testName);
    const searchBtn = page.getByRole("button", { name: "検索" });
    await expect(searchBtn).toBeEnabled();
    await searchBtn.dispatchEvent("click");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`td:has-text("${testName}")`)).toBeVisible({
      timeout: 10000,
    });
  });

  test("編集 → 保存", async ({ page }) => {
    await page.goto("/master/customer");

    // 最初の行の編集ボタンをクリック（アイコンボタンのため位置で特定、ハイドレーション後まで待機）
    const editBtn = page.locator("tbody tr").first().locator("button").first();
    await expect(editBtn).toBeEnabled();
    await expect(async () => {
      await editBtn.dispatchEvent("click");
      await expect(page.getByText("得意先情報の修正")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    // 備考フィールドを更新
    const remark = `E2Eテスト更新 ${Date.now()}`;
    await page.fill('textarea[name="備考"], input[name="備考"]', remark);
    const saveBtn = page.getByRole("button", { name: "保存する" });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.dispatchEvent("click");

    // ダイアログが閉じることを確認
    await expect(page.locator("text=得意先情報の修正")).not.toBeVisible({
      timeout: 15000,
    });
  });

  test("削除 → 確認ダイアログ → 削除実行", async ({ page }) => {
    // 削除用のテストデータを先に作成
    const testName = `E2E削除${Date.now()}`;

    await page.goto("/master/customer");
    const newBtn = page.getByRole("button", { name: "新規追加" });
    await expect(newBtn).toBeEnabled();
    await newBtn.dispatchEvent("click");
    await page.fill('input[name="得意先名"]', testName);
    const saveBtn = page.getByRole("button", { name: "保存する" });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.dispatchEvent("click");
    await expect(page.locator("text=得意先の新規登録")).not.toBeVisible({
      timeout: 15000,
    });

    // 作成したデータをキーワード検索して絞り込む
    await page.fill('input[name="q"]', testName);
    const searchBtn = page.getByRole("button", { name: "検索" });
    await expect(searchBtn).toBeEnabled();
    await searchBtn.dispatchEvent("click");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`td:has-text("${testName}")`)).toBeVisible({
      timeout: 10000,
    });

    // 編集ダイアログを開く（アイコンボタンのため位置で特定、ハイドレーション後まで待機）
    const editBtn = page.locator("tbody tr").first().locator("button").first();
    await expect(editBtn).toBeEnabled();
    await expect(async () => {
      await editBtn.dispatchEvent("click");
      await expect(page.getByText("得意先情報の修正")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    // 削除ボタンを特定する関数（毎回最新のDOMを検索させる）
    const getDeleteButton = () =>
      page.locator('[role="dialog"] button').filter({ hasText: /^削除$/ });
    await expect(getDeleteButton()).toBeEnabled({ timeout: 10000 });
    await getDeleteButton().dispatchEvent("click");
    await expect(page.getByText("本当に削除しますか？")).toBeVisible();
    await page.getByRole("button", { name: "削除実行" }).dispatchEvent("click");

    // 削除後、確認ダイアログが閉じることを確認
    await expect(page.locator("text=本当に削除しますか？")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test.afterAll(async ({ browser }) => {
    if (createdCustomerNames.length === 0) return;

    const page = await browser.newPage();
    await adminLogin(page);

    for (const name of createdCustomerNames) {
      await page.goto("/master/customer");
      await page.fill('input[name="q"]', name);
      const searchBtn = page.getByRole("button", { name: "検索" });
      await expect(searchBtn).toBeEnabled();
      await searchBtn.dispatchEvent("click");
      await page.waitForLoadState("networkidle");

      if ((await page.locator("tbody tr").count()) === 0) continue;

      const editBtn = page
        .locator("tbody tr")
        .first()
        .locator("button")
        .first();
      await expect(editBtn).toBeEnabled();
      await expect(async () => {
        await editBtn.dispatchEvent("click");
        await expect(page.getByText("得意先情報の修正")).toBeVisible({
          timeout: 1000,
        });
      }).toPass();

      const deleteButton = page
        .locator('[role="dialog"] button')
        .filter({ hasText: /^削除$/ });
      await expect(deleteButton).toBeEnabled({ timeout: 10000 });
      await deleteButton.dispatchEvent("click");
      await page
        .locator("text=本当に削除しますか？")
        .waitFor({ state: "visible" });
      await page.getByRole("button", { name: "削除実行" }).dispatchEvent("click");
      await page
        .locator("text=本当に削除しますか？")
        .waitFor({ state: "hidden", timeout: 10000 });
    }

    await page.close();
  });
});
