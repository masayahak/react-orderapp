import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CustomerPage from "@/app/(protected)/master/customer/page";

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
  "@/app/(protected)/master/customer/_components/得意先ListServer",
  () => ({
    CustomerListServer: () => (
      <div data-testid="mock-customer-list">Customer List</div>
    ),
  }),
);

// ─── テスト ───────────────────────────────────────────

describe("得意先マスタページ", () => {
  it("「得意先マスタメンテナンス」タイトルが表示されること", async () => {
    const searchParams = Promise.resolve({});
    const pageElement = await CustomerPage({ searchParams });
    render(pageElement);

    expect(
      screen.getByRole("heading", { level: 1, name: "得意先マスタメンテナンス" }),
    ).toBeInTheDocument();
  });

  it("CustomerListServer コンポーネントが表示されること", async () => {
    const searchParams = Promise.resolve({});
    const pageElement = await CustomerPage({ searchParams });
    render(pageElement);

    expect(screen.getByTestId("mock-customer-list")).toBeInTheDocument();
  });

  it("検索パラメータが渡された場合もレンダリングされること", async () => {
    const searchParams = Promise.resolve({ q: "テスト", page: "2" });
    const pageElement = await CustomerPage({ searchParams });
    render(pageElement);

    expect(
      screen.getByRole("heading", { level: 1, name: "得意先マスタメンテナンス" }),
    ).toBeInTheDocument();
  });
});
