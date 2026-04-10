import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductList } from "@/app/(protected)/master/product/_components/商品List";

// ─── モック設定 ───────────────────────────────────────

const { mockPush, mockSearchParamsGet, mockSearchParamsToString } = vi.hoisted(
  () => ({
    mockPush: vi.fn(),
    mockSearchParamsGet: vi.fn().mockReturnValue(null),
    mockSearchParamsToString: vi.fn().mockReturnValue(""),
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    toString: mockSearchParamsToString,
  }),
}));

vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader2-icon" />,
  Pencil: () => <div data-testid="pencil-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
}));

vi.mock(
  "@/app/(protected)/master/product/_components/商品Dialog",
  () => ({
    ProductDialog: () => <div data-testid="mock-product-dialog" />,
  }),
);

// ─── テストデータ ──────────────────────────────────────

const sampleProducts = [
  { 商品CD: "PROD-001", 商品名: "ガンダム", 単価: 1000, version: 0 },
  { 商品CD: "PROD-002", 商品名: "ザク", 単価: 500, version: 1 },
];

// ─── テスト ───────────────────────────────────────────

describe("ProductList コンポーネント", () => {
  describe("データあり", () => {
    it("商品名が表示されること", () => {
      render(
        <ProductList
          pageData={sampleProducts}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(screen.getByText("ガンダム")).toBeInTheDocument();
      expect(screen.getByText("ザク")).toBeInTheDocument();
    });

    it("商品CDが表示されること", () => {
      render(
        <ProductList
          pageData={sampleProducts}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(screen.getByText("PROD-001")).toBeInTheDocument();
      expect(screen.getByText("PROD-002")).toBeInTheDocument();
    });

    it("件数表示が正しいこと", () => {
      render(
        <ProductList
          pageData={sampleProducts}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(screen.getByText(/全 2 件中/)).toBeInTheDocument();
    });
  });

  describe("データなし", () => {
    it("「該当する商品が見つかりません」が表示されること", () => {
      render(
        <ProductList pageData={[]} totalCount={0} pageSize={20} />,
      );

      expect(
        screen.getByText("該当する商品が見つかりません"),
      ).toBeInTheDocument();
    });
  });

  describe("UI要素", () => {
    it("検索ボタンが表示されること", () => {
      render(
        <ProductList
          pageData={sampleProducts}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(screen.getByRole("button", { name: "検索" })).toBeInTheDocument();
    });

    it("新規追加ボタンが表示されること", () => {
      render(
        <ProductList
          pageData={sampleProducts}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(
        screen.getByRole("button", { name: /新規追加/ }),
      ).toBeInTheDocument();
    });

    it("各行に編集ボタンが表示されること", () => {
      render(
        <ProductList
          pageData={sampleProducts}
          totalCount={2}
          pageSize={20}
        />,
      );

      const editButtons = screen.getAllByRole("button", { name: /を編集/ });
      expect(editButtons).toHaveLength(2);
    });
  });
});
