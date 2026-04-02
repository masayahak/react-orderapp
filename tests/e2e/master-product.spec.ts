import { expect, test } from "@playwright/test";

import { adminLogin } from "./helpers/login";

// 同一ファイル内のテストが並列実行されると revalidatePath の相互干渉でダイアログが不安定になるためシリアル実行
test.describe.configure({ mode: "serial" });

const createdProductCodes: string[] = [];

test.describe("商品マスタ", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("一覧が表示される", async ({ page }) => {
    await page.goto("/master/product");
    await expect(
      page.locator("h1:has-text('商品マスタメンテナンス')"),
    ).toBeVisible();
    await expect(page.locator("th:has-text('商品CD')")).toBeVisible();
    await expect(page.locator("th:has-text('商品名')")).toBeVisible();
    await expect(page.locator("th:has-text('単価')")).toBeVisible();
  });

  test("キーワード検索", async ({ page }) => {
    await page.goto("/master/product");
    await page.fill('input[name="q"]', "ザク");
    const searchBtn = page.getByRole("button", { name: "検索" });
    await expect(searchBtn).toBeEnabled();
    await searchBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("td:has-text('ザク')").first()).toBeVisible();
  });

  test("新規登録 → 保存 → 検索で存在確認", async ({ page }) => {
    const testCode = `TST-${Date.now()}`;
    createdProductCodes.push(testCode);
    const testName = `テスト商品 ${Date.now()}`;

    await page.goto("/master/product");
    const newBtn = page.getByRole("button", { name: "新規追加" });
    await expect(newBtn).toBeEnabled();
    await newBtn.click();
    await expect(page.locator("text=商品の新規登録")).toBeVisible();

    await page.fill('input[name="商品CD"]', testCode);
    await page.fill('input[name="商品名"]', testName);
    await page.fill('input[name="単価"]', "1500");

    const saveBtn = page.getByRole("button", { name: "保存する" });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
    await expect(page.locator("text=商品の新規登録")).not.toBeVisible({
      timeout: 15000,
    });

    // 検索で新規登録した商品を確認
    await page.fill('input[name="q"]', testCode);
    const searchBtn = page.getByRole("button", { name: "検索" });
    await expect(searchBtn).toBeEnabled();
    await searchBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`td:has-text("${testCode}")`)).toBeVisible({
      timeout: 10000,
    });
  });

  test("編集 → 保存", async ({ page }) => {
    await page.goto("/master/product");

    // 最初の行の編集ボタンをクリック（アイコンボタンのため位置で特定、ハイドレーション後まで待機）
    const editBtn = page.locator("tbody tr").first().locator("button").first();
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toBeEnabled();
    await expect(async () => {
      await editBtn.click();
      await expect(page.getByText("商品情報の修正")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    // 備考フィールドを更新
    const remark = `E2Eテスト更新 ${Date.now()}`;
    await page.fill('textarea[name="備考"], input[name="備考"]', remark);
    const saveBtn = page.getByRole("button", { name: "保存する" });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // ダイアログが閉じることを確認
    await expect(page.locator("text=商品情報の修正")).not.toBeVisible({
      timeout: 15000,
    });
  });

  test("削除 → 確認ダイアログ → 削除実行", async ({ page }) => {
    // 削除用のテストデータを先に作成
    const testCode = `DEL-${Date.now()}`;
    const testName = `削除テスト ${Date.now()}`;

    await page.goto("/master/product");
    const newBtn = page.getByRole("button", { name: "新規追加" });
    await expect(newBtn).toBeEnabled();
    await newBtn.click();
    await page.fill('input[name="商品CD"]', testCode);
    await page.fill('input[name="商品名"]', testName);
    await page.fill('input[name="単価"]', "100");
    const saveBtn = page.getByRole("button", { name: "保存する" });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
    await expect(page.locator("text=商品の新規登録")).not.toBeVisible({
      timeout: 15000,
    });

    // 作成したデータをキーワード検索して絞り込む
    await page.fill('input[name="q"]', testCode);
    const searchBtn = page.getByRole("button", { name: "検索" });
    await expect(searchBtn).toBeEnabled();
    await searchBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`td:has-text("${testCode}")`)).toBeVisible({
      timeout: 10000,
    });

    // 編集ダイアログを開く（アイコンボタンのため位置で特定、ハイドレーション後まで待機）
    const editBtn = page.locator("tbody tr").first().locator("button").first();
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toBeEnabled();
    await expect(async () => {
      await editBtn.click();
      await expect(page.getByText("商品情報の修正")).toBeVisible({
        timeout: 1000,
      });
    }).toPass();

    // 削除ボタンを特定する関数（毎回最新のDOMを検索させる）
    const getDeleteButton = () =>
      page.locator('[role="dialog"] button').filter({ hasText: /^削除$/ });
    await expect(getDeleteButton()).toBeVisible({ timeout: 10000 });
    await getDeleteButton().dispatchEvent("click");
    await expect(page.getByText("本当に削除しますか？")).toBeVisible();
    await page.getByRole("button", { name: "削除実行" }).click();

    // 削除後、確認ダイアログが閉じることを確認
    await expect(page.locator("text=本当に削除しますか？")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test.afterAll(async ({ browser }) => {
    if (createdProductCodes.length === 0) return;

    const page = await browser.newPage();
    await adminLogin(page);

    for (const code of createdProductCodes) {
      await page.goto("/master/product");
      await page.fill('input[name="q"]', code);
      const searchBtn = page.getByRole("button", { name: "検索" });
      await expect(searchBtn).toBeEnabled();
      await searchBtn.click();
      await page.waitForLoadState("networkidle");

      if ((await page.locator("tbody tr").count()) === 0) continue;

      const editBtn = page
        .locator("tbody tr")
        .first()
        .locator("button")
        .first();
      await expect(editBtn).toBeVisible();
      await expect(editBtn).toBeEnabled();
      await expect(async () => {
        await editBtn.click();
        await expect(page.getByText("商品情報の修正")).toBeVisible({
          timeout: 1000,
        });
      }).toPass();

      const deleteButton = page
        .locator('[role="dialog"] button')
        .filter({ hasText: /^削除$/ });
      await deleteButton.waitFor({ state: "visible", timeout: 10000 });
      await deleteButton.click();
      await page
        .locator("text=本当に削除しますか？")
        .waitFor({ state: "visible" });
      await page.getByRole("button", { name: "削除実行" }).click();
      await page
        .locator("text=本当に削除しますか？")
        .waitFor({ state: "hidden", timeout: 10000 });
    }

    await page.close();
  });
});
