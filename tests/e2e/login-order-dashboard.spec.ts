import { expect, test } from "@playwright/test";

test.describe("Login to Order to Dashboard Flow", () => {
  // 認証状態をテスト間で共有しない（毎回ログインから行う）
  test.use({ storageState: { cookies: [], origins: [] } });

  test("テストアカウントでログインし、受注を登録してダッシュボードを確認する", async ({ page }) => {
    // ------------------------------------------------------------------------
    // 1. ログイン処理
    // ------------------------------------------------------------------------
    await test.step("ログインページにアクセスし、認証する", async () => {
      await page.goto("/login");
      
      // ログインフォームの入力
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "kyouhayuki");
      
      // ログインボタンのクリック
      await page.click('button[type="submit"]:has-text("ログイン")');
      
      // ダッシュボードへのリダイレクトを待機
      await page.waitForURL("**/dashboard");
      await expect(page).toHaveURL(/.*\/dashboard/);
      
      // ダッシュボードのタイトルまたはヘッダーが表示されることを確認
      await expect(page.locator("h1:has-text('Analysis')").first()).toBeVisible();
    });

    // ------------------------------------------------------------------------
    // 2. 受注登録処理
    // ------------------------------------------------------------------------
    await test.step("新規受注登録ページに遷移し、フォームを入力して保存する", async () => {
      // サイドメニュー等から「受注登録」をクリック（直接遷移でも可）
      await page.goto("/order/new");
      await expect(page.locator("h1:has-text('受注起票')").or(page.locator("text='受注起票'"))).toBeVisible();

      // --- フォームの入力 ---
      
      // 1. 得意先の選択（Comboboxの操作）
      await page.click('button[role="combobox"]:has-text("得意先を検索...")');
      // 検索フィールドに入力
      await page.fill('[placeholder="検索キーワードを入力..."]', "テスト");
      // 検索結果が出るまで少し待機
      await page.waitForTimeout(1000);
      // キーボード操作で最初の候補を選択
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // 2. 商品明細の追加（1行目）
      // "CD検索..." のCombobox
      await page.click('button[role="combobox"]:has-text("CD検索...")');
      await page.fill('[placeholder="検索キーワードを入力..."]', "テスト");
      await page.waitForTimeout(1000);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // 数量の入力（デフォルト1を書き換える）
      const quantityInput = page.locator('input[type="number"]').first();
      await quantityInput.click();
      await quantityInput.fill("5");

      // React Hook Formの状態更新等を待つ
      await page.waitForTimeout(1000);

      // 保存ボタンのクリック
      await page.click('button[type="submit"]:has-text("受注を確定する")');

      // 成功メッセージ（Sonnerトースト）を待機
      await expect(page.locator("text='受注を登録しました'")).toBeVisible();
      
      // 一覧画面(/order) へのリダイレクトを待機
      await page.waitForURL("**/order");
      await expect(page).toHaveURL(/.*\/order/);
    });

    // ------------------------------------------------------------------------
    // 3. ダッシュボードの確認
    // ------------------------------------------------------------------------
    await test.step("ダッシュボードに戻り、データが表示されることを確認する", async () => {
      await page.goto("/dashboard");
      
      // 売上サマリーや推移チャートの要素がレンダリングされるのを待つ
      // 具体的な数値はテストデータに依存するため、UIコンポーネントの存在を確認
      await expect(page.locator("text='売上金額 (合計)'").first()).toBeVisible();
      await expect(page.locator("text='受注件数 (合計)'").first()).toBeVisible();
      
      // チャート特有の要素（SVGやRechartsのコンテナ）が見えるか確認
      await expect(page.locator(".recharts-wrapper").first()).toBeVisible();
    });
  });
});
