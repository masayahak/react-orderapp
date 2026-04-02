import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  delete得意先,
  save得意先,
} from "@/app/(protected)/master/customer/actions";

// ─── モック設定 ───────────────────────────────────────

vi.mock("@/lib/auth-guard", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    user: { id: "admin-user-id", name: "管理者", role: "admin" },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/db/repository/得意先Repository", () => ({
  得意先Repository: {
    Insert: vi.fn(),
    Update: vi.fn(),
    Delete: vi.fn(),
  },
}));

// ─── テストデータ ──────────────────────────────────────

const validCustomerData = {
  得意先名: "テスト株式会社",
  電話番号: "03-1234-5678",
  備考: "テスト備考",
  version: 0,
};

// ─── テスト ───────────────────────────────────────────

// ─── 認可チェック ─────────────────────────────────────

describe("認可チェック", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("save得意先 実行時に requireAdmin が呼ばれること", async () => {
    const { requireAdmin } = await import("@/lib/auth-guard");
    const { 得意先Repository } = await import("@/db/repository/得意先Repository");
    vi.mocked(得意先Repository.Insert).mockResolvedValueOnce([]);

    await save得意先(validCustomerData, false);

    expect(requireAdmin).toHaveBeenCalledOnce();
  });

  it("delete得意先 実行時に requireAdmin が呼ばれること", async () => {
    const { requireAdmin } = await import("@/lib/auth-guard");
    const { 得意先Repository } = await import("@/db/repository/得意先Repository");
    vi.mocked(得意先Repository.Delete).mockResolvedValueOnce(undefined as never);

    await delete得意先("customer-uuid-001", 0);

    expect(requireAdmin).toHaveBeenCalledOnce();
  });
});

// ─── save得意先 ────────────────────────────────────────

describe("save得意先 (新規登録)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規登録が成功すると { success: true } が返ること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Insert).mockResolvedValueOnce([]);

    const result = await save得意先(validCustomerData, false);

    expect(result).toEqual({ success: true });
    expect(得意先Repository.Insert).toHaveBeenCalledOnce();
  });

  it("新規登録成功時に /master/customer がrevalidateされること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    const { revalidatePath } = await import("next/cache");
    vi.mocked(得意先Repository.Insert).mockResolvedValueOnce([]);

    await save得意先(validCustomerData, false);

    expect(revalidatePath).toHaveBeenCalledWith("/master/customer");
  });

  it("Repositoryがエラーをスローした場合、エラーメッセージが返ること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Insert).mockRejectedValueOnce(
      new Error("データベース接続エラー"),
    );

    const result = await save得意先(validCustomerData, false);

    expect(result).toEqual({
      success: false,
      error: "データベース接続エラー",
    });
  });

  it("予期せぬエラーが発生した場合、フォールバックメッセージが返ること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Insert).mockRejectedValueOnce("unknown");

    const result = await save得意先(validCustomerData, false);

    expect(result).toEqual({
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    });
  });

  it("得意先名が空の場合はZodエラーが返ること", async () => {
    const result = await save得意先({ ...validCustomerData, 得意先名: "" }, false);

    expect(result).toEqual({
      success: false,
      error: "入力内容に不備があります。画面の指示に従ってください。",
    });
  });
});

describe("save得意先 (更新)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("得意先IDを含む更新が成功すると { success: true } が返ること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Update).mockResolvedValueOnce(undefined as never);

    const result = await save得意先(
      { ...validCustomerData, 得意先ID: "customer-uuid-001" },
      true,
    );

    expect(result).toEqual({ success: true });
    expect(得意先Repository.Update).toHaveBeenCalledWith(
      "customer-uuid-001",
      0,
      expect.objectContaining({ 得意先名: "テスト株式会社" }),
    );
  });

  it("更新時に得意先IDが未指定の場合はエラーが返ること", async () => {
    // isEdit=true だが 得意先ID が undefined
    const result = await save得意先(validCustomerData, true);

    expect(result).toEqual({
      success: false,
      error: "更新対象のIDが指定されていません。",
    });
  });

  it("Repositoryがエラーをスローした場合、エラーメッセージが返ること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Update).mockRejectedValueOnce(
      new Error("楽観的排他制御エラー"),
    );

    const result = await save得意先(
      { ...validCustomerData, 得意先ID: "customer-uuid-001" },
      true,
    );

    expect(result).toEqual({
      success: false,
      error: "楽観的排他制御エラー",
    });
  });
});

describe("delete得意先", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常に削除できると成功レスポンスが返ること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Delete).mockResolvedValueOnce(undefined as never);

    const result = await delete得意先("customer-uuid-001", 0);

    expect(result).toEqual({ success: true });
    expect(得意先Repository.Delete).toHaveBeenCalledWith(
      "customer-uuid-001",
      0,
    );
  });

  it("削除成功時に /master/customer がrevalidateされること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    const { revalidatePath } = await import("next/cache");
    vi.mocked(得意先Repository.Delete).mockResolvedValueOnce(undefined as never);

    await delete得意先("customer-uuid-001", 0);

    expect(revalidatePath).toHaveBeenCalledWith("/master/customer");
  });

  it("Repositoryがエラーをスローした場合、エラーメッセージが返ること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Delete).mockRejectedValueOnce(
      new Error("削除対象が見つかりません"),
    );

    const result = await delete得意先("customer-uuid-001", 0);

    expect(result).toEqual({
      success: false,
      error: "削除対象が見つかりません",
    });
  });

  it("予期せぬエラーが発生した場合、フォールバックメッセージが返ること", async () => {
    const { 得意先Repository } = await import(
      "@/db/repository/得意先Repository"
    );
    vi.mocked(得意先Repository.Delete).mockRejectedValueOnce("unknown");

    const result = await delete得意先("customer-uuid-001", 0);

    expect(result).toEqual({
      success: false,
      error: "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
    });
  });
});
