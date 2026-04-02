# 単体テスト

- テストフレームワーク: Vitest
- テストファイル: tests/unit/
- テスト結果: tests-results/unit/

# 結合テスト（E2E）

- テストフレームワーク: Playwright
- テストファイル: tests/e2e/
- テスト結果: tests-results/e2e/

## E2E テストの書き方

### クリック操作

- `.click()` ではなく `.dispatchEvent("click")` を使う（ハイドレーション前の空振り防止）
- `page.click('selector')` → `page.locator('selector').dispatchEvent("click")`
- ボタン以外（combobox の option 等）も同様

### ボタン待機

- クリック前は `await expect(btn).toBeEnabled()` で待機する
- `toBeVisible()` や `waitFor({ state: "visible" })` はボタン待機に使わない

### テキスト要素の待機

- ダイアログ・見出し等の表示確認は `toBeVisible()` を使う（非表示確認も同様）

### ハイドレーション対策（toPass パターン）

ハイドレーション後に初めて有効になるボタンは `toPass()` でリトライする：

```ts
await expect(editBtn).toBeEnabled();
await expect(async () => {
  await editBtn.dispatchEvent("click");
  await expect(page.getByText("ダイアログタイトル")).toBeVisible({
    timeout: 1000,
  });
}).toPass();
```

### DOM更新後の要素取得

DOM更新で参照が変わりうる要素は都度取得する関数として定義する：

```ts
const getDeleteButton = () =>
  page.locator('[role="dialog"] button').filter({ hasText: /^削除$/ });
await expect(getDeleteButton()).toBeEnabled({ timeout: 10000 });
await getDeleteButton().dispatchEvent("click");
```

---

## 本プロジェクト固有

### 認可テスト

- 一般ユーザーが admin 限定ページにアクセスした場合、requireAdmin() → redirect("/") → proxy が / を /dashboard にリダイレクトする
- 期待 URL は / ではなく /dashboard
