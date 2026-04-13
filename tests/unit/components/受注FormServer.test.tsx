import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderFormServer } from "@/app/(protected)/order/_components/受注FormServer";

// ─── モック設定 ───────────────────────────────────────

const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

vi.mock("@/db/repository/受注Repository", () => ({
  受注Repository: {
    SearchById: vi.fn(),
  },
}));

vi.mock("@/app/(protected)/order/_components/受注Form", () => ({
  OrderForm: ({ mode, serverDate, initialData }: {
    mode: string;
    serverDate: string;
    initialData?: Record<string, unknown>;
  }) => (
    <div
      data-testid="mock-order-form"
      data-mode={mode}
      data-server-date={serverDate}
      data-has-initial-data={initialData !== undefined ? "true" : "false"}
    />
  ),
}));

// ─── テストデータ ──────────────────────────────────────

const existingOrder = {
  受注ID: "order-uuid-001",
  受注日: "2024-01-15",
  得意先ID: "cust-001",
  得意先名: "テスト株式会社",
  合計金額: 2000,
  version: 1,
  明細: [
    {
      商品CD: "PROD-001",
      商品名: "テスト商品",
      単価: 1000,
      数量: 2,
      明細金額: 2000,
    },
  ],
};

// ─── テスト ───────────────────────────────────────────

describe("OrderFormServer コンポーネント（新規作成モード）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create モードで OrderForm が表示されること", async () => {
    const element = await OrderFormServer({ mode: "create" });
    render(element);

    expect(screen.getByTestId("mock-order-form")).toBeInTheDocument();
  });

  it("create モードで mode='create' が渡されること", async () => {
    const element = await OrderFormServer({ mode: "create" });
    render(element);

    expect(screen.getByTestId("mock-order-form")).toHaveAttribute(
      "data-mode",
      "create",
    );
  });

  it("create モードでは initialData が渡されないこと", async () => {
    const element = await OrderFormServer({ mode: "create" });
    render(element);

    expect(screen.getByTestId("mock-order-form")).toHaveAttribute(
      "data-has-initial-data",
      "false",
    );
  });

  it("create モードでは Repository.SearchById が呼ばれないこと", async () => {
    const { 受注Repository } = await import("@/db/repository/受注Repository");

    await OrderFormServer({ mode: "create" });

    expect(受注Repository.SearchById).not.toHaveBeenCalled();
  });
});

describe("OrderFormServer コンポーネント（編集モード）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("edit モードで受注が見つかると OrderForm が表示されること", async () => {
    const { 受注Repository } = await import("@/db/repository/受注Repository");
    vi.mocked(受注Repository.SearchById).mockResolvedValueOnce(
      existingOrder as never,
    );

    const element = await OrderFormServer({ mode: "edit", id: "order-uuid-001" });
    render(element);

    expect(screen.getByTestId("mock-order-form")).toBeInTheDocument();
  });

  it("edit モードで mode='edit' が渡されること", async () => {
    const { 受注Repository } = await import("@/db/repository/受注Repository");
    vi.mocked(受注Repository.SearchById).mockResolvedValueOnce(
      existingOrder as never,
    );

    const element = await OrderFormServer({ mode: "edit", id: "order-uuid-001" });
    render(element);

    expect(screen.getByTestId("mock-order-form")).toHaveAttribute(
      "data-mode",
      "edit",
    );
  });

  it("edit モードでは initialData が渡されること", async () => {
    const { 受注Repository } = await import("@/db/repository/受注Repository");
    vi.mocked(受注Repository.SearchById).mockResolvedValueOnce(
      existingOrder as never,
    );

    const element = await OrderFormServer({ mode: "edit", id: "order-uuid-001" });
    render(element);

    expect(screen.getByTestId("mock-order-form")).toHaveAttribute(
      "data-has-initial-data",
      "true",
    );
  });

  it("edit モードで Repository.SearchById が正しい ID で呼ばれること", async () => {
    const { 受注Repository } = await import("@/db/repository/受注Repository");
    vi.mocked(受注Repository.SearchById).mockResolvedValueOnce(
      existingOrder as never,
    );

    await OrderFormServer({ mode: "edit", id: "order-uuid-001" });

    expect(受注Repository.SearchById).toHaveBeenCalledWith("order-uuid-001");
  });

  it("edit モードで受注が見つからない場合は notFound が呼ばれること", async () => {
    const { 受注Repository } = await import("@/db/repository/受注Repository");
    vi.mocked(受注Repository.SearchById).mockResolvedValueOnce(null as never);

    await expect(
      OrderFormServer({ mode: "edit", id: "not-exist-id" }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("edit モードで id が未指定の場合は notFound が呼ばれること", async () => {
    await expect(
      OrderFormServer({ mode: "edit" }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
  });
});
