import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a
      href={String(href)}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        mockPush(String(href));
      }}
      {...props}
    >
      {children}
    </a>
  ),
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
    ProductDialog: ({ onClose }: { onClose: () => void }) => (
      <div data-testid="mock-product-dialog">
        <button onClick={onClose}>閉じる</button>
      </div>
    ),
  }),
);

// ─── テストデータ ──────────────────────────────────────

const sampleProducts = [
  { 商品CD: "PROD-001", 商品名: "ガンダム", 単価: 1000, version: 0 },
  { 商品CD: "PROD-002", 商品名: "ザク", 単価: 500, version: 1 },
];

// ─── テスト ───────────────────────────────────────────

describe("ProductList コンポーネント", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSearchParamsGet.mockReturnValue(null);
    mockSearchParamsToString.mockReturnValue("");
  });

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

    it("単価が表示されること", () => {
      render(
        <ProductList
          pageData={sampleProducts}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(
        screen.getByText(`¥${(1000).toLocaleString()}`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`¥${(500).toLocaleString()}`),
      ).toBeInTheDocument();
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

  describe("ページ変更", () => {
    it("1ページ目では「前へ」ボタンが無効化されること", () => {
      render(
        <ProductList pageData={sampleProducts} totalCount={2} pageSize={20} />,
      );

      expect(screen.getByRole("button", { name: "前へ" })).toBeDisabled();
    });

    it("最終ページでは「次へ」ボタンが無効化されること", () => {
      render(
        <ProductList pageData={sampleProducts} totalCount={2} pageSize={20} />,
      );

      expect(screen.getByRole("button", { name: "次へ" })).toBeDisabled();
    });

    it("複数ページある場合は「次へ」ボタンが有効になること", () => {
      render(
        <ProductList pageData={sampleProducts} totalCount={25} pageSize={20} />,
      );

      expect(screen.getByRole("link", { name: "次へ" })).toBeInTheDocument();
    });

    it("「次へ」ボタンをクリックすると page=2 で router.push が呼ばれること", () => {
      render(
        <ProductList pageData={sampleProducts} totalCount={25} pageSize={20} />,
      );

      fireEvent.click(screen.getByRole("link", { name: "次へ" }));
      expect(mockPush).toHaveBeenCalledWith("?page=2");
    });

    it("2ページ目で「前へ」ボタンをクリックすると page=1 で router.push が呼ばれること", () => {
      mockSearchParamsGet.mockReturnValue("2");
      render(
        <ProductList pageData={sampleProducts} totalCount={25} pageSize={20} />,
      );

      fireEvent.click(screen.getByRole("link", { name: "前へ" }));
      expect(mockPush).toHaveBeenCalledWith("?page=1");
    });
  });

  describe("検索", () => {
    it("キーワードを入力して検索すると q と page=1 で router.push が呼ばれること", () => {
      render(
        <ProductList pageData={sampleProducts} totalCount={2} pageSize={20} />,
      );

      fireEvent.change(screen.getByPlaceholderText("検索ワードを入力…"), {
        target: { value: "ガンダム" },
      });
      fireEvent.submit(
        screen.getByRole("button", { name: "検索" }).closest("form")!,
      );
      expect(mockPush).toHaveBeenCalledWith(
        "?q=%E3%82%AC%E3%83%B3%E3%83%80%E3%83%A0&page=1",
      );
    });

    it("キーワードが空の場合、q を含まず page=1 で router.push が呼ばれること", () => {
      render(
        <ProductList pageData={sampleProducts} totalCount={2} pageSize={20} />,
      );

      fireEvent.submit(
        screen.getByRole("button", { name: "検索" }).closest("form")!,
      );
      expect(mockPush).toHaveBeenCalledWith("?page=1");
    });
  });

  describe("ダイアログ", () => {
    it("新規追加ボタンをクリックするとダイアログが表示されること", () => {
      render(
        <ProductList pageData={sampleProducts} totalCount={2} pageSize={20} />,
      );

      fireEvent.click(screen.getByRole("button", { name: /新規追加/ }));
      expect(screen.getByTestId("mock-product-dialog")).toBeInTheDocument();
    });

    it("編集ボタンをクリックするとダイアログが表示されること", () => {
      render(
        <ProductList pageData={sampleProducts} totalCount={2} pageSize={20} />,
      );

      fireEvent.click(screen.getAllByRole("button", { name: /を編集/ })[0]);
      expect(screen.getByTestId("mock-product-dialog")).toBeInTheDocument();
    });

    it("ダイアログを閉じるとダイアログが非表示になること", () => {
      render(
        <ProductList pageData={sampleProducts} totalCount={2} pageSize={20} />,
      );

      fireEvent.click(screen.getByRole("button", { name: /新規追加/ }));
      expect(screen.getByTestId("mock-product-dialog")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
      expect(screen.queryByTestId("mock-product-dialog")).not.toBeInTheDocument();
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
