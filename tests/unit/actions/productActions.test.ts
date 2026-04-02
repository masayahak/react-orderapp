import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  delete商品,
  save商品,
} from "@/app/(protected)/master/product/actions";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/lib/auth-guard", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    user: { id: "admin-user-id", name: "管理者", role: "admin" },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/db/repository/商品Repository", () => ({
  商品Repository: {
    Insert: vi.fn(),
    Update: vi.fn(),
    Delete: vi.fn(),
  },
}));

// ─── テストデータ ──────────────────────────────────────

const validProductData = {
  商品CD: "PROD-001",
  商品名: "テスト商品",
  単価: 1000,
  備考: "",
  version: 0,
};

// ─── テスト ───────────────────────────────────────────

// ─── 認可チェック ─────────────────────────────────────

describe("認可チェック", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("save商品 実行時に requireAdmin が呼ばれること", async () => {
    const { requireAdmin } = await import("@/lib/auth-guard");
    const { 商品Repository } = await import("@/db/repository/商品Repository");
    vi.mocked(商品Repository.Insert).mockResolvedValueOnce([{ 商品CD: "PROD-001" }]);

    await save商品(validProductData, false);

    expect(requireAdmin).toHaveBeenCalledOnce();
  });

  it("delete商品 実行時に requireAdmin が呼ばれること", async () => {
    const { requireAdmin } = await import("@/lib/auth-guard");
    const { 商品Repository } = await import("@/db/repository/商品Repository");
    vi.mocked(商品Repository.Delete).mockResolvedValueOnce(undefined);

    await delete商品("PROD-001", 0);

    expect(requireAdmin).toHaveBeenCalledOnce();
  });
});

// ─── save商品 ──────────────────────────────────────────

describe("save商品 (新規登録)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規登録が成功すると { success: true } が返ること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Insert).mockResolvedValueOnce([{ 商品CD: "PROD-001" }]);

    const result = await save商品(validProductData, false);

    expect(result).toEqual({ success: true });
    expect(商品Repository.Insert).toHaveBeenCalledOnce();
  });

  it("商品CDが既に存在する場合はエラーメッセージが返ること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    // Insert が空配列を返す → 既に存在する商品CD
    vi.mocked(商品Repository.Insert).mockResolvedValueOnce([]);

    const result = await save商品(validProductData, false);

    expect(result).toEqual({ success: false, error: "商品が既に存在します" });
  });

  it("新規登録成功時に /master/product がrevalidateされること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    const { revalidatePath } = await import("next/cache");
    vi.mocked(商品Repository.Insert).mockResolvedValueOnce([{ 商品CD: "PROD-001" }]);

    await save商品(validProductData, false);

    expect(revalidatePath).toHaveBeenCalledWith("/master/product");
  });

  it("Repositoryがエラーをスローした場合、エラーメッセージが返ること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Insert).mockRejectedValueOnce(
      new Error("データベースエラー"),
    );

    const result = await save商品(validProductData, false);

    expect(result).toEqual({
      success: false,
      error: "データベースエラー",
    });
  });

  it("予期せぬエラーが発生した場合、フォールバックメッセージが返ること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Insert).mockRejectedValueOnce("unknown");

    const result = await save商品(validProductData, false);

    expect(result).toEqual({
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    });
  });

  it("商品CDが空の場合はZodエラーが返ること", async () => {
    const result = await save商品({ ...validProductData, 商品CD: "" }, false);

    expect(result).toEqual({
      success: false,
      error: "入力内容に不備があります。画面の指示に従ってください。",
    });
  });

  it("商品名が空の場合はZodエラーが返ること", async () => {
    const result = await save商品({ ...validProductData, 商品名: "" }, false);

    expect(result).toEqual({
      success: false,
      error: "入力内容に不備があります。画面の指示に従ってください。",
    });
  });

  it("単価が負の場合はZodエラーが返ること", async () => {
    const result = await save商品({ ...validProductData, 単価: -1 }, false);

    expect(result).toEqual({
      success: false,
      error: "入力内容に不備があります。画面の指示に従ってください。",
    });
  });
});

describe("save商品 (更新)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("更新が成功すると { success: true } が返ること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Update).mockResolvedValueOnce(undefined);

    const result = await save商品(validProductData, true);

    expect(result).toEqual({ success: true });
    expect(商品Repository.Update).toHaveBeenCalledWith(
      "PROD-001",
      0,
      expect.objectContaining({ 商品名: "テスト商品" }),
    );
  });

  it("更新成功時に /master/product がrevalidateされること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    const { revalidatePath } = await import("next/cache");
    vi.mocked(商品Repository.Update).mockResolvedValueOnce(undefined);

    await save商品(validProductData, true);

    expect(revalidatePath).toHaveBeenCalledWith("/master/product");
  });

  it("Repositoryがエラーをスローした場合、エラーメッセージが返ること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Update).mockRejectedValueOnce(
      new Error("楽観的排他制御エラー"),
    );

    const result = await save商品(validProductData, true);

    expect(result).toEqual({
      success: false,
      error: "楽観的排他制御エラー",
    });
  });
});

describe("delete商品", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常に削除できると成功レスポンスが返ること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Delete).mockResolvedValueOnce(undefined);

    const result = await delete商品("PROD-001", 0);

    expect(result).toEqual({ success: true });
    expect(商品Repository.Delete).toHaveBeenCalledWith("PROD-001", 0);
  });

  it("削除成功時に /master/product がrevalidateされること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    const { revalidatePath } = await import("next/cache");
    vi.mocked(商品Repository.Delete).mockResolvedValueOnce(undefined);

    await delete商品("PROD-001", 0);

    expect(revalidatePath).toHaveBeenCalledWith("/master/product");
  });

  it("Repositoryがエラーをスローした場合、エラーメッセージが返ること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Delete).mockRejectedValueOnce(
      new Error("削除対象が見つかりません"),
    );

    const result = await delete商品("PROD-001", 0);

    expect(result).toEqual({
      success: false,
      error: "削除対象が見つかりません",
    });
  });

  it("予期せぬエラーが発生した場合、フォールバックメッセージが返ること", async () => {
    const { 商品Repository } = await import(
      "@/db/repository/商品Repository"
    );
    vi.mocked(商品Repository.Delete).mockRejectedValueOnce("unknown");

    const result = await delete商品("PROD-001", 0);

    expect(result).toEqual({
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    });
  });
});
