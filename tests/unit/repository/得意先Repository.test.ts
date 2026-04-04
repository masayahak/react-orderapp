import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── モック設定 ───────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});

vi.mock("uuidv7", () => ({
  uuidv7: vi.fn().mockReturnValue("generated-uuid"),
}));

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/db/drizzle", () => ({ db: mockDb }));

// ─── テストデータ ──────────────────────────────────────

const dbRow = {
  得意先ID: "customer-uuid-001",
  得意先名: "テスト株式会社",
  電話番号: "03-1234-5678",
  備考: "テスト備考",
  version: 0,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const parsedOutput = {
  得意先ID: "customer-uuid-001",
  得意先名: "テスト株式会社",
  電話番号: "03-1234-5678",
  備考: "テスト備考",
  version: 0,
};

// ─── テスト ───────────────────────────────────────────

describe("得意先Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Search ──────────────────────────────────────────

  describe("Search", () => {
    it("キーワードにマッチする得意先一覧と総件数が返ること", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      // 1回目: count クエリ
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 1 }]),
        }),
      });
      // 2回目: データ取得クエリ
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([dbRow]),
              }),
            }),
          }),
        }),
      });

      const result = await 得意先Repository.Search("テスト", 1, 10);

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(parsedOutput);
    });

    it("マッチしない場合は空配列と0が返ること", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 0 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const result = await 得意先Repository.Search("存在しない", 1, 10);

      expect(result.totalCount).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it("ページングのoffsetが正しく計算されること（page=2, pageSize=10 → offset=10）", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 25 }]),
        }),
      });

      const mockOffset = vi.fn().mockResolvedValue([]);
      const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: mockLimit,
            }),
          }),
        }),
      });

      await 得意先Repository.Search("テスト", 2, 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(10);
    });
  });

  // ─── SearchBy ────────────────────────────────────────

  describe("SearchBy", () => {
    it("IDに一致する得意先が返ること", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dbRow]),
          }),
        }),
      });

      const result = await 得意先Repository.SearchBy("customer-uuid-001");

      expect(result).toEqual(parsedOutput);
    });

    it("存在しないIDの場合はnullが返ること", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await 得意先Repository.SearchBy("nonexistent-id");

      expect(result).toBeNull();
    });
  });

  // ─── Insert ──────────────────────────────────────────

  describe("Insert", () => {
    it("生成したUUIDとversion=0を付与してinsertされること", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      const mockReturning = vi.fn().mockResolvedValue([dbRow]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockDb.insert.mockReturnValueOnce({ values: mockValues });

      const input = {
        得意先名: "テスト株式会社",
        電話番号: "03-1234-5678",
        備考: "テスト備考",
      };

      await 得意先Repository.Insert(input);

      expect(mockValues).toHaveBeenCalledWith({
        ...input,
        得意先ID: "generated-uuid",
        version: 0,
      });
      expect(mockReturning).toHaveBeenCalledOnce();
    });
  });

  // ─── Update ──────────────────────────────────────────

  describe("Update", () => {
    it("versionをインクリメントしてupdateされること", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      const mockWhere = vi
        .fn()
        .mockResolvedValue({ rowCount: 1 });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValueOnce({ set: mockSet });

      const input = {
        得意先名: "更新後株式会社",
        電話番号: "03-9999-9999",
        備考: null,
      };

      await 得意先Repository.Update("customer-uuid-001", 2, input);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          ...input,
          version: 3, // 現在のversion(2) + 1
        }),
      );
    });

    it("対象が存在しない場合（rowCount=0）はエラーがスローされること", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 0 }),
        }),
      });

      await expect(
        得意先Repository.Update("customer-uuid-001", 0, {
          得意先名: "更新後",
          電話番号: null,
          備考: null,
        }),
      ).rejects.toThrow(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    });
  });

  // ─── Delete ──────────────────────────────────────────

  describe("Delete", () => {
    it("IDとversionの条件でdeleteされること", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.delete.mockReturnValueOnce({ where: mockWhere });

      await 得意先Repository.Delete("customer-uuid-001", 0);

      expect(mockDb.delete).toHaveBeenCalledOnce();
      expect(mockWhere).toHaveBeenCalledOnce();
    });

    it("対象が存在しない場合（rowCount=0）はエラーがスローされること", async () => {
      const { 得意先Repository } = await import(
        "@/db/repository/得意先Repository"
      );

      mockDb.delete.mockReturnValueOnce({
        where: vi.fn().mockResolvedValue({ rowCount: 0 }),
      });

      await expect(
        得意先Repository.Delete("customer-uuid-001", 0),
      ).rejects.toThrow(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    });
  });
});
