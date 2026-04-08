import { type InferSelectModel } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type 商品Output } from "@/db/model/商品Model";
import { 商品 } from "@/db/schema";

// ─── モック設定 ───────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/db/drizzle", () => ({ db: mockDb }));

// ─── テストデータ ──────────────────────────────────────

const dbRow: InferSelectModel<typeof 商品> = {
  商品CD: "P001",
  商品名: "テスト商品",
  単価: "1000",
  備考: "テスト備考",
  version: 0,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const parsedOutput: 商品Output = {
  商品CD: "P001",
  商品名: "テスト商品",
  単価: 1000,
  備考: "テスト備考",
  version: 0,
};

// ─── テスト ───────────────────────────────────────────

describe("商品Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Search ──────────────────────────────────────────

  describe("Search", () => {
    it("キーワードにマッチする商品一覧と総件数が返ること", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

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

      const result = await 商品Repository.Search("テスト", 1, 10);

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(parsedOutput);
    });

    it("マッチしない場合は空配列と0が返ること", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

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

      const result = await 商品Repository.Search("存在しない", 1, 10);

      expect(result.totalCount).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it("ページングのoffsetが正しく計算されること（page=3, pageSize=10 → offset=20）", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

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

      await 商品Repository.Search("テスト", 3, 10);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(20);
    });
  });

  // ─── SearchById ────────────────────────────────────────

  describe("SearchById", () => {
    it("商品CDに一致する商品が返ること", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dbRow]),
          }),
        }),
      });

      const result = await 商品Repository.SearchById("P001");

      expect(result).toEqual(parsedOutput);
    });

    it("存在しない商品CDの場合はnullが返ること", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await 商品Repository.SearchById("NONEXISTENT");

      expect(result).toBeNull();
    });
  });

  // ─── Insert ──────────────────────────────────────────

  describe("Insert", () => {
    const input: 商品Output = {
      商品CD: "P001",
      商品名: "テスト商品",
      単価: 1000,
      備考: "テスト備考",
      version: 0,
    };

    it("単価をstringに変換し、version=0でinsertされること", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

      const mockReturning = vi.fn().mockResolvedValue([dbRow]);
      const mockOnConflict = vi
        .fn()
        .mockReturnValue({ returning: mockReturning });
      const mockValues = vi
        .fn()
        .mockReturnValue({ onConflictDoNothing: mockOnConflict });
      mockDb.insert.mockReturnValueOnce({ values: mockValues });

      await 商品Repository.Insert(input);

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          単価: "1000", // 数値 → 文字列変換されること
          version: 0,
        }),
      );
      expect(mockReturning).toHaveBeenCalledOnce();
    });

    it("商品CDが重複した場合はエラーにならず空配列が返ること（onConflictDoNothing）", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

      const mockReturning = vi.fn().mockResolvedValue([]); // 競合時は空配列
      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi
            .fn()
            .mockReturnValue({ returning: mockReturning }),
        }),
      });

      const result = await 商品Repository.Insert(input);

      expect(result).toHaveLength(0);
      expect(mockReturning).toHaveBeenCalledOnce();
    });
  });

  // ─── Update ──────────────────────────────────────────

  describe("Update", () => {
    it("versionをインクリメントして単価をstringに変換してupdateされること", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 1 });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValueOnce({ set: mockSet });

      const input = {
        商品名: "更新後商品",
        単価: 2000,
        備考: null,
      };

      await 商品Repository.Update("P001", 2, input);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          単価: "2000", // 数値 → 文字列変換されること
          version: 3, // 現在のversion(2) + 1
        }),
      );
    });

    it("対象が存在しない場合（rowCount=0）はエラーがスローされること", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 0 }),
        }),
      });

      await expect(
        商品Repository.Update("P001", 0, {
          商品名: "更新後商品",
          単価: 1000,
          備考: null,
        }),
      ).rejects.toThrow(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    });
  });

  // ─── Delete ──────────────────────────────────────────

  describe("Delete", () => {
    it("商品CDとversionの条件でdeleteされること", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.delete.mockReturnValueOnce({ where: mockWhere });

      await 商品Repository.Delete("P001", 0);

      expect(mockDb.delete).toHaveBeenCalledOnce();
      expect(mockWhere).toHaveBeenCalledOnce();
    });

    it("対象が存在しない場合（rowCount=0）はエラーがスローされること", async () => {
      const { 商品Repository } = await import("@/db/repository/商品Repository");

      mockDb.delete.mockReturnValueOnce({
        where: vi.fn().mockResolvedValue({ rowCount: 0 }),
      });

      await expect(商品Repository.Delete("P001", 0)).rejects.toThrow(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    });
  });
});
