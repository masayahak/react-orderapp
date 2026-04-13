import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrderPage from "@/app/(protected)/order/page";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/lib/auth-guard", () => ({
  requireSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", name: "テストユーザー", role: "user" },
  }),
}));

vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader2-icon" />,
}));

vi.mock("@/app/(protected)/order/_components/受注ListServer", () => ({
  OrderListServer: () => <div data-testid="mock-order-list">Order List</div>,
}));

// ─── テスト ───────────────────────────────────────────

describe("認可チェック", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ページレンダリング時に requireSession が呼ばれること", async () => {
    const { requireSession } = await import("@/lib/auth-guard");
    const searchParams = Promise.resolve({});
    const pageElement = await OrderPage({ searchParams });
    render(pageElement);

    expect(requireSession).toHaveBeenCalledOnce();
  });
});

describe("受注一覧ページ", () => {
  it("「受注一覧」タイトルが表示されること", async () => {
    const searchParams = Promise.resolve({});
    const pageElement = await OrderPage({ searchParams });
    render(pageElement);

    expect(
      screen.getByRole("heading", { level: 1, name: "受注一覧" }),
    ).toBeInTheDocument();
  });

  it("OrderListServer コンポーネントが表示されること", async () => {
    const searchParams = Promise.resolve({});
    const pageElement = await OrderPage({ searchParams });
    render(pageElement);

    expect(screen.getByTestId("mock-order-list")).toBeInTheDocument();
  });

  it("検索パラメータが渡された場合もレンダリングされること", async () => {
    const searchParams = Promise.resolve({
      q: "テスト株式会社",
      page: "2",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    });
    const pageElement = await OrderPage({ searchParams });
    render(pageElement);

    expect(
      screen.getByRole("heading", { level: 1, name: "受注一覧" }),
    ).toBeInTheDocument();
  });
});
