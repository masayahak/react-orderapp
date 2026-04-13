import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderListServer } from "@/app/(protected)/order/_components/受注ListServer";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/env", () => ({
  env: { PAGE_ROW_COUNT: 20 },
}));

vi.mock("@/db/repository/受注Repository", () => ({
  受注Repository: {
    Search: vi.fn().mockResolvedValue({
      items: [
        {
          受注ID: "aabbccdd-1111-2222-3333-444455556666",
          受注日: "2024-01-15",
          得意先ID: "customer-uuid-001",
          得意先名: "テスト株式会社",
          合計金額: 10000,
          version: 0,
        },
      ],
      totalCount: 1,
    }),
  },
}));

vi.mock("@/app/(protected)/order/_components/受注List", () => ({
  OrderList: () => <div data-testid="mock-order-list" />,
}));

// ─── テスト ───────────────────────────────────────────

describe("OrderListServer コンポーネント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("OrderList が表示されること", async () => {
    const element = await OrderListServer({
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(screen.getByTestId("mock-order-list")).toBeInTheDocument();
  });

  it("Repository が正しい引数で呼ばれること", async () => {
    const { 受注Repository } = await import("@/db/repository/受注Repository");

    await OrderListServer({
      searchParams: Promise.resolve({
        q: "テスト",
        page: "2",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      }),
    });

    expect(受注Repository.Search).toHaveBeenLastCalledWith({
      keyword: "テスト",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      page: 2,
      pageSize: 20,
    });
  });

  it("検索パラメータが省略された場合はデフォルト値で呼ばれること", async () => {
    const { 受注Repository } = await import("@/db/repository/受注Repository");

    await OrderListServer({ searchParams: Promise.resolve({}) });

    expect(受注Repository.Search).toHaveBeenLastCalledWith({
      keyword: "",
      startDate: "",
      endDate: "",
      page: 1,
      pageSize: 20,
    });
  });
});
