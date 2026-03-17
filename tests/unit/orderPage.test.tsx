import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// テスト対象のコンポーネント
import OrderPage from "@/app/(protected)/order/page";

// --- モックの設定 ---

// 1. @/lib/auth-guard
// ログイン状態をシミュレート（例外を投げずに解決する）
vi.mock("@/lib/auth-guard", () => ({
  requireSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", name: "Test User" },
  }),
}));

// 2. lucide-react (Client Component内や親で使われているアイコン等のエラーよけ)
vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader2-icon" />,
}));

// 3. ./_components/受注ListServer
// Server ComponentとしてDBアクセスなどを行わないように、ダミー要素を返す
vi.mock("@/app/(protected)/order/_components/受注ListServer", () => ({
  OrderListServer: () => <div data-testid="mock-order-list">Mock Order List</div>,
}));

describe("Order Page Rendering", () => {
  it("初期レンダリングで『受注一覧』のタイトルが表示されること", async () => {
    // 検索パラメータのモック
    const searchParams = Promise.resolve({});

    // Server Component を呼び出す
    const pageElement = await OrderPage({ searchParams });

    // JSX を render
    render(pageElement);

    // テキストが表示されているか確認
    expect(screen.getByRole("heading", { level: 1, name: "受注一覧" })).toBeInTheDocument();
  });
});
