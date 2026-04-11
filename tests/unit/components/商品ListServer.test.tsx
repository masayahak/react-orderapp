import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductListServer } from "@/app/(protected)/master/product/_components/商品ListServer";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/env", () => ({
  env: { PAGE_ROW_COUNT: 20 },
}));

vi.mock("@/db/repository/商品Repository", () => ({
  商品Repository: {
    Search: vi.fn().mockResolvedValue({
      items: [
        { 商品CD: "PROD-001", 商品名: "テスト商品", 単価: 1000, version: 0 },
      ],
      totalCount: 1,
    }),
  },
}));

vi.mock(
  "@/app/(protected)/master/product/_components/商品List",
  () => ({
    ProductList: () => <div data-testid="mock-product-list" />,
  }),
);

// ─── テスト ───────────────────────────────────────────

describe("ProductListServer コンポーネント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ProductList が表示されること", async () => {
    const element = await ProductListServer({ query: "", page: 1 });
    render(element);

    expect(screen.getByTestId("mock-product-list")).toBeInTheDocument();
  });

  it("Repository が正しい引数で呼ばれること", async () => {
    const { 商品Repository } = await import("@/db/repository/商品Repository");

    await ProductListServer({ query: "ガンダム", page: 2 });

    expect(商品Repository.Search).toHaveBeenLastCalledWith("ガンダム", 2, 20);
  });
});
