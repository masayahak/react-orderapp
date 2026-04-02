import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProductPage from "@/app/(protected)/master/product/page";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/lib/auth-guard", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    user: { id: "admin-user-id", name: "管理者", role: "admin" },
  }),
}));

vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader2-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Pencil: () => <div data-testid="pencil-icon" />,
  Trash2: () => <div data-testid="trash2-icon" />,
}));

vi.mock(
  "@/app/(protected)/master/product/_components/商品ListServer",
  () => ({
    ProductListServer: () => (
      <div data-testid="mock-product-list">Product List</div>
    ),
  }),
);

// ─── テスト ───────────────────────────────────────────

describe("商品マスタページ", () => {
  it("「商品マスタメンテナンス」タイトルが表示されること", async () => {
    const searchParams = Promise.resolve({});
    const pageElement = await ProductPage({ searchParams });
    render(pageElement);

    expect(
      screen.getByRole("heading", { level: 1, name: "商品マスタメンテナンス" }),
    ).toBeInTheDocument();
  });

  it("ProductListServer コンポーネントが表示されること", async () => {
    const searchParams = Promise.resolve({});
    const pageElement = await ProductPage({ searchParams });
    render(pageElement);

    expect(screen.getByTestId("mock-product-list")).toBeInTheDocument();
  });

  it("検索パラメータが渡された場合もレンダリングされること", async () => {
    const searchParams = Promise.resolve({ q: "ガンダム", page: "3" });
    const pageElement = await ProductPage({ searchParams });
    render(pageElement);

    expect(
      screen.getByRole("heading", { level: 1, name: "商品マスタメンテナンス" }),
    ).toBeInTheDocument();
  });
});
