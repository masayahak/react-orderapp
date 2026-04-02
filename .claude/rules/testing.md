# 単体テスト

- テストフレームワーク: Vitest
- テストファイルは tests/unit/ ディレクトリに配置
- テスト結果ファイルは tests-results/unit/ ディレクトリに配置

# 結合テスト

- テストフレームワーク: playwright
- テストファイルは tests/e2e/ ディレクトリに配置
- テスト結果ファイルは tests-results/e2e/ ディレクトリに配置

## E2E テストの書き方ルール

### クリック操作

- ボタンのクリックは `.click()` ではなく `.dispatchEvent("click")` を使う
  - `.click()` はハイドレーション前に空振りする場合があるため
- `page.click('selector')` も同様に `page.locator('selector').dispatchEvent("click")` へ変換する
- ボタン以外のリスト項目（combobox の option など）も `.dispatchEvent("click")` を使う

### ボタン待機

- ボタンをクリックする前は `await expect(btn).toBeEnabled()` で待機する
  - `toBeVisible()` はDOM上に存在するだけで通過するため、操作可能かどうかを保証できない
- `waitFor({ state: "visible" })` をボタン待機に使わない。代わりに `expect(...).toBeEnabled()` を使う

### ダイアログ・テキストの待機

- ダイアログや見出しなどのテキスト要素の表示確認は `toBeVisible()` のまま使う
- 非表示確認（`not.toBeVisible()`）も変更しない

### ハイドレーション対策（toPass パターン）

- ハイドレーション後に初めてクリックが有効になるボタン（テーブル行の編集ボタンなど）は `toPass()` でリトライする

```ts
await expect(editBtn).toBeEnabled();
await expect(async () => {
  await editBtn.dispatchEvent("click");
  await expect(page.getByText("ダイアログタイトル")).toBeVisible({ timeout: 1000 });
}).toPass();
```

### 削除ボタンの取得

- ダイアログ内の削除ボタンはDOM更新のたびに参照が変わる可能性があるため、都度取得する関数として定義する

```ts
const getDeleteButton = () =>
  page.locator('[role="dialog"] button').filter({ hasText: /^削除$/ });
await expect(getDeleteButton()).toBeEnabled({ timeout: 10000 });
await getDeleteButton().dispatchEvent("click");
```

### 認可テスト

- 一般ユーザーが admin 限定ページにアクセスした場合、`requireAdmin()` → `redirect("/")` → proxy が `/` を `/dashboard` にリダイレクトする
- 期待 URL は `/` ではなく `/dashboard`
