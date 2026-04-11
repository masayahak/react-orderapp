import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerList } from "@/app/(protected)/master/customer/_components/得意先List";

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
  "@/app/(protected)/master/customer/_components/得意先Dialog",
  () => ({
    CustomerDialog: () => <div data-testid="mock-customer-dialog" />,
  }),
);

// ─── テストデータ ──────────────────────────────────────

const sampleCustomers = [
  { 得意先ID: "uuid-001", 得意先名: "ハカマタソフト", 電話番号: "03-1234-5678", version: 0 },
  { 得意先ID: "uuid-002", 得意先名: "テスト株式会社", 電話番号: "06-9876-5432", version: 1 },
];

// ─── テスト ───────────────────────────────────────────

describe("CustomerList コンポーネント", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe("データあり", () => {
    it("得意先名が表示されること", () => {
      render(
        <CustomerList
          pageData={sampleCustomers}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(screen.getByText("ハカマタソフト")).toBeInTheDocument();
      expect(screen.getByText("テスト株式会社")).toBeInTheDocument();
    });

    it("電話番号が表示されること", () => {
      render(
        <CustomerList
          pageData={sampleCustomers}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(screen.getByText("03-1234-5678")).toBeInTheDocument();
      expect(screen.getByText("06-9876-5432")).toBeInTheDocument();
    });

    it("件数表示が正しいこと", () => {
      render(
        <CustomerList
          pageData={sampleCustomers}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(screen.getByText(/全 2 件中/)).toBeInTheDocument();
    });
  });

  describe("データなし", () => {
    it("「該当する得意先が見つかりません」が表示されること", () => {
      render(
        <CustomerList pageData={[]} totalCount={0} pageSize={20} />,
      );

      expect(
        screen.getByText("該当する得意先が見つかりません"),
      ).toBeInTheDocument();
    });
  });

  describe("ページ変更", () => {
    it("次へボタンをクリックすると page=2 で router.push が呼ばれること", () => {
      render(
        <CustomerList pageData={sampleCustomers} totalCount={25} pageSize={20} />,
      );

      fireEvent.click(screen.getByRole("button", { name: "次へ" }));
      expect(mockPush).toHaveBeenCalledWith("?page=2");
    });

    it("前へボタンをクリックすると page=1 で router.push が呼ばれること", () => {
      mockSearchParamsGet.mockReturnValue("2");
      render(
        <CustomerList pageData={sampleCustomers} totalCount={25} pageSize={20} />,
      );

      fireEvent.click(screen.getByRole("button", { name: "前へ" }));
      expect(mockPush).toHaveBeenCalledWith("?page=1");
    });
  });

  describe("検索", () => {
    it("キーワードを入力して検索すると q と page=1 で router.push が呼ばれること", () => {
      render(
        <CustomerList pageData={sampleCustomers} totalCount={2} pageSize={20} />,
      );

      fireEvent.change(screen.getByPlaceholderText("検索ワードを入力…"), {
        target: { value: "ハカマタ" },
      });
      fireEvent.submit(
        screen.getByRole("button", { name: "検索" }).closest("form")!,
      );
      expect(mockPush).toHaveBeenCalledWith(
        "?q=%E3%83%8F%E3%82%AB%E3%83%9E%E3%82%BF&page=1",
      );
    });
  });

  describe("UI要素", () => {
    it("検索ボタンが表示されること", () => {
      render(
        <CustomerList
          pageData={sampleCustomers}
          totalCount={2}
          pageSize={20}
        />,
      );

      expect(screen.getByRole("button", { name: "検索" })).toBeInTheDocument();
    });

    it("新規追加ボタンが表示されること", () => {
      render(
        <CustomerList
          pageData={sampleCustomers}
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
        <CustomerList
          pageData={sampleCustomers}
          totalCount={2}
          pageSize={20}
        />,
      );

      const editButtons = screen.getAllByRole("button", { name: /を編集/ });
      expect(editButtons).toHaveLength(2);
    });
  });
});
