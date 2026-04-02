import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrderList } from "@/app/(protected)/order/_components/受注List";

// ─── モック設定 ───────────────────────────────────────

const { mockPush, mockSearchParamsGet, mockSearchParamsToString } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSearchParamsGet: vi.fn().mockReturnValue(null),
  mockSearchParamsToString: vi.fn().mockReturnValue(""),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    toString: mockSearchParamsToString,
  }),
}));

vi.mock("lucide-react", () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
  Pencil: () => <div data-testid="pencil-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
}));

// ─── テストデータ ──────────────────────────────────────

const sampleOrders = [
  {
    受注ID: "aabbccdd-1111-2222-3333-444455556666",
    受注日: "2024-01-15",
    得意先ID: "customer-uuid-001",
    得意先名: "テスト株式会社",
    合計金額: 10000,
    version: 0,
  },
  {
    受注ID: "zzyyxxww-9999-8888-7777-666655554444",
    受注日: "2024-01-16",
    得意先ID: "customer-uuid-002",
    得意先名: "サンプル商事",
    合計金額: 25000,
    version: 1,
  },
];

// ─── テスト ───────────────────────────────────────────

describe("OrderList コンポーネント", () => {
  it("受注データが表示されること", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    expect(screen.getByText("テスト株式会社")).toBeInTheDocument();
    expect(screen.getByText("サンプル商事")).toBeInTheDocument();
  });

  it("データが空の場合に「該当する受注データは見つかりませんでした」が表示されること", () => {
    render(<OrderList initialData={[]} totalCount={0} pageSize={20} />);

    expect(
      screen.getByText("該当する受注データは見つかりませんでした"),
    ).toBeInTheDocument();
  });

  it("受注IDが短縮表示されること（先頭8文字）", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    // 受注ID の先頭8文字が表示される
    expect(screen.getByText("aabbccdd")).toBeInTheDocument();
    expect(screen.getByText("zzyyxxww")).toBeInTheDocument();
  });

  it("ページングの総件数・表示範囲が正しく表示されること", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={45} pageSize={20} />,
    );

    // 1ページ目なので 1-20 件を表示
    expect(screen.getByText(/全 45 件中/)).toBeInTheDocument();
    expect(screen.getByText(/1 - 20 件を表示/)).toBeInTheDocument();
  });

  it("データが0件の場合に「該当データなし」が表示されること", () => {
    render(<OrderList initialData={[]} totalCount={0} pageSize={20} />);

    expect(screen.getByText("該当データなし")).toBeInTheDocument();
  });

  it("1ページ目では「前へ」ボタンが無効化されること", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    const prevButton = screen.getByRole("button", { name: "前へ" });
    expect(prevButton).toBeDisabled();
  });

  it("最終ページでは「次へ」ボタンが無効化されること", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    const nextButton = screen.getByRole("button", { name: "次へ" });
    expect(nextButton).toBeDisabled();
  });

  it("複数ページある場合は「次へ」ボタンが有効になること", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={100} pageSize={20} />,
    );

    const nextButton = screen.getByRole("button", { name: "次へ" });
    expect(nextButton).not.toBeDisabled();
  });

  it("テーブルヘッダが正しく表示されること", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    expect(screen.getByText("受注ID")).toBeInTheDocument();
    expect(screen.getByText("受注日")).toBeInTheDocument();
    expect(screen.getByText("得意先名")).toBeInTheDocument();
    expect(screen.getByText("合計金額")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
  });

  it("検索フォームが表示されること", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    expect(screen.getByText("開始日")).toBeInTheDocument();
    expect(screen.getByText("終了日")).toBeInTheDocument();
    expect(screen.getByText("キーワード (得意先・商品)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "検索" })).toBeInTheDocument();
  });

  it("「新規受注」ボタンが表示されること", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    expect(screen.getByRole("button", { name: /新規受注/ })).toBeInTheDocument();
  });

  it("ページ番号が正しく表示されること", () => {
    render(
      <OrderList initialData={sampleOrders} totalCount={100} pageSize={20} />,
    );

    // 現在のページ数 / 総ページ数
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});

describe("OrderList インタラクション", () => {
  it("「次へ」ボタンをクリックすると page=2 で router.push が呼ばれること", () => {
    mockSearchParamsGet.mockReturnValue(null);
    mockSearchParamsToString.mockReturnValue("");

    render(
      <OrderList initialData={sampleOrders} totalCount={100} pageSize={20} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    expect(mockPush).toHaveBeenCalledWith("?page=2");
  });

  it("2ページ目で「前へ」ボタンをクリックすると page=1 で router.push が呼ばれること", () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "page" ? "2" : null,
    );
    mockSearchParamsToString.mockReturnValue("page=2");

    render(
      <OrderList initialData={sampleOrders} totalCount={100} pageSize={20} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "前へ" }));

    expect(mockPush).toHaveBeenCalledWith("?page=1");
  });

  it("検索フォームをサブミットすると q・startDate・endDate・page=1 を含む URL で router.push が呼ばれること", () => {
    mockSearchParamsGet.mockReturnValue(null);
    mockSearchParamsToString.mockReturnValue("");

    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    fireEvent.change(screen.getByPlaceholderText("検索ワードを入力..."), {
      target: { value: "テスト" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "検索" }).closest("form")!);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("q=%E3%83%86%E3%82%B9%E3%83%88"),
    );
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
  });

  it("「新規受注」ボタンをクリックすると /order/new へ遷移すること", () => {
    mockSearchParamsGet.mockReturnValue(null);
    mockSearchParamsToString.mockReturnValue("");

    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /新規受注/ }));

    expect(mockPush).toHaveBeenCalledWith("/order/new");
  });

  it("searchParams がある場合、「新規受注」遷移先にクエリが付与されること", () => {
    mockSearchParamsGet.mockReturnValue(null);
    mockSearchParamsToString.mockReturnValue("page=2&q=test");

    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /新規受注/ }));

    expect(mockPush).toHaveBeenCalledWith("/order/new?page=2&q=test");
  });

  it("行の編集ボタンをクリックすると /order/[id] へ遷移すること", () => {
    mockSearchParamsGet.mockReturnValue(null);
    mockSearchParamsToString.mockReturnValue("");

    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    const editButtons = screen.getAllByTitle("修正");
    fireEvent.click(editButtons[0]);

    expect(mockPush).toHaveBeenCalledWith(
      `/order/${sampleOrders[0].受注ID}`,
    );
  });

  it("searchParams がある場合、編集遷移先にクエリが付与されること", () => {
    mockSearchParamsGet.mockReturnValue(null);
    mockSearchParamsToString.mockReturnValue("page=2");

    render(
      <OrderList initialData={sampleOrders} totalCount={2} pageSize={20} />,
    );

    const editButtons = screen.getAllByTitle("修正");
    fireEvent.click(editButtons[0]);

    expect(mockPush).toHaveBeenCalledWith(
      `/order/${sampleOrders[0].受注ID}?page=2`,
    );
  });
});
