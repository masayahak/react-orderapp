import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  delete受注,
  save受注,
  search商品,
  search得意先,
} from "@/app/(protected)/order/actions";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/lib/auth-guard", () => ({
  requireSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", name: "テストユーザー", role: "user" },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/db/repository/受注Repository", () => ({
  受注Repository: {
    Save: vi.fn(),
    Delete: vi.fn(),
  },
}));

vi.mock("@/db/repository/商品Repository", () => ({
  商品Repository: {
    Search: vi.fn(),
  },
}));

vi.mock("@/db/repository/得意先Repository", () => ({
  得意先Repository: {
    Search: vi.fn(),
  },
}));

// ─── テストデータ ──────────────────────────────────────

const validOrderData = {
  受注日: "2024-01-15",
  得意先ID: "customer-uuid-001",
  得意先名: "テスト得意先",
  合計金額: 2000,
  version: 0,
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

describe("save受注", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常な受注データを渡すと成功レスポンスが返ること", async () => {
    const { 受注Repository } = await import(
      "@/db/repository/受注Repository"
    );
    vi.mocked(受注Repository.Save).mockResolvedValueOnce(undefined);

    const result = await save受注(validOrderData as any, "create");

    expect(result).toEqual({ success: true });
    expect(受注Repository.Save).toHaveBeenCalledOnce();
  });

  it("editモードで受注IDを渡すと Repository.Save に渡されること", async () => {
    const { 受注Repository } = await import(
      "@/db/repository/受注Repository"
    );
    vi.mocked(受注Repository.Save).mockResolvedValueOnce(undefined);

    await save受注(
      { ...validOrderData, 受注ID: "order-uuid-001" } as any,
      "edit",
      "order-uuid-001",
    );

    expect(受注Repository.Save).toHaveBeenCalledWith(
      expect.anything(),
      "edit",
      "order-uuid-001",
    );
  });

  it("Repositoryがエラーをスローした場合、エラーメッセージが返ること", async () => {
    const { 受注Repository } = await import(
      "@/db/repository/受注Repository"
    );
    vi.mocked(受注Repository.Save).mockRejectedValueOnce(
      new Error("楽観的排他制御エラー"),
    );

    const result = await save受注(validOrderData as any, "create");

    expect(result).toEqual({
      success: false,
      error: "楽観的排他制御エラー",
    });
  });

  it("予期せぬエラーが発生した場合、フォールバックメッセージが返ること", async () => {
    const { 受注Repository } = await import(
      "@/db/repository/受注Repository"
    );
    // Error インスタンスではない値をスロー
    vi.mocked(受注Repository.Save).mockRejectedValueOnce("unknown error");

    const result = await save受注(validOrderData as any, "create");

    expect(result).toEqual({
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    });
  });

  it("成功時に revalidatePath が /dashboard と /order で呼ばれること", async () => {
    const { 受注Repository } = await import(
      "@/db/repository/受注Repository"
    );
    const { revalidatePath } = await import("next/cache");
    vi.mocked(受注Repository.Save).mockResolvedValueOnce(undefined);

    await save受注(validOrderData as any, "create");

    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/order");
  });
});

describe("delete受注", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常に削除できると成功レスポンスが返ること", async () => {
    const { 受注Repository } = await import(
      "@/db/repository/受注Repository"
    );
    vi.mocked(受注Repository.Delete).mockResolvedValueOnce(undefined);

    const result = await delete受注("order-uuid-001", 0);

    expect(result).toEqual({ success: true });
    expect(受注Repository.Delete).toHaveBeenCalledWith("order-uuid-001", 0);
  });

  it("Repositoryがエラーをスローした場合、エラーメッセージが返ること", async () => {
    const { 受注Repository } = await import(
      "@/db/repository/受注Repository"
    );
    vi.mocked(受注Repository.Delete).mockRejectedValueOnce(
      new Error("該当する受注が見つかりません"),
    );

    const result = await delete受注("order-uuid-001", 0);

    expect(result).toEqual({
      success: false,
      error: "該当する受注が見つかりません",
    });
  });

  it("予期せぬエラーが発生した場合、フォールバックメッセージが返ること", async () => {
    const { 受注Repository } = await import(
      "@/db/repository/受注Repository"
    );
    vi.mocked(受注Repository.Delete).mockRejectedValueOnce("unknown");

    const result = await delete受注("order-uuid-001", 0);

    expect(result).toEqual({
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    });
  });

  it("成功時に revalidatePath が /dashboard と /order で呼ばれること", async () => {
    const { 受注Repository } = await import(
      "@/db/repository/受注Repository"
    );
    const { revalidatePath } = await import("next/cache");
    vi.mocked(受注Repository.Delete).mockResolvedValueOnce(undefined);

    await delete受注("order-uuid-001", 0);

    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/order");
  });
});

describe("search得意先", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("検索結果が得意先ID・得意先名にマップされること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Search).mockResolvedValueOnce({
      items: [
        {
          得意先ID: "uuid-001",
          得意先名: "テスト株式会社",
          電話番号: "03-1234-5678",
          備考: null,
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          得意先ID: "uuid-002",
          得意先名: "サンプル商事",
          電話番号: null,
          備考: null,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      totalCount: 2,
    });

    const result = await search得意先("テスト");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ 得意先ID: "uuid-001", 得意先名: "テスト株式会社" });
    expect(result[1]).toEqual({ 得意先ID: "uuid-002", 得意先名: "サンプル商事" });
  });

  it("検索結果が空の場合は空配列を返すこと", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Search).mockResolvedValueOnce({
      items: [],
      totalCount: 0,
    });

    const result = await search得意先("存在しない");

    expect(result).toEqual([]);
  });
});

describe("search商品", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("検索結果が商品CD・商品名・単価にマップされること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Search).mockResolvedValueOnce({
      items: [
        {
          商品CD: "PROD-001",
          商品名: "テスト商品A",
          単価: 1000,
          備考: null,
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          商品CD: "PROD-002",
          商品名: "テスト商品B",
          単価: 2500,
          備考: "在庫注意",
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      totalCount: 2,
    });

    const result = await search商品("テスト");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      商品CD: "PROD-001",
      商品名: "テスト商品A",
      単価: 1000,
    });
    expect(result[1]).toEqual({
      商品CD: "PROD-002",
      商品名: "テスト商品B",
      単価: 2500,
    });
  });

  it("検索結果が空の場合は空配列を返すこと", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Search).mockResolvedValueOnce({
      items: [],
      totalCount: 0,
    });

    const result = await search商品("存在しない");

    expect(result).toEqual([]);
  });
});
