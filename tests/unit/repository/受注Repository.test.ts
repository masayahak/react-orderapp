import { type InferSelectModel } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type 受注HeaderOutput, type 受注Output } from "@/db/model/受注Model";
import { 受注, 受注明細 } from "@/db/schema";

// ─── モック設定 ───────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});

vi.mock("uuidv7", () => ({
  uuidv7: vi.fn().mockReturnValue("generated-order-uuid"),
}));

// exists() はサブクエリオブジェクトをSQL断片としてラップするが、
// mockDbでは .where() がモック化されているため実際のSQL生成は不要。
// drizzle-orm の exists のみ無害なオブジェクトを返すようスタブする。
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, exists: vi.fn().mockReturnValue({}) };
});

// トランザクション内での実行用モック
const mockTx = {
  update: vi.fn(),
  delete: vi.fn(),
  insert: vi.fn(),
};

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(),
};

vi.mock("@/db/drizzle", () => ({ db: mockDb }));

// ─── テストデータ ──────────────────────────────────────

const headerRow: InferSelectModel<typeof 受注> = {
  受注ID: "order-uuid-001",
  受注日: "2024-01-15",
  得意先ID: "customer-uuid-001",
  得意先名: "テスト株式会社",
  合計金額: "50000",
  備考: null,
  version: 0,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-15"),
};

const detailRow: InferSelectModel<typeof 受注明細> = {
  受注明細ID: "detail-uuid-001",
  受注ID: "order-uuid-001",
  商品CD: "P001",
  商品名: "テスト商品",
  単価: "1000",
  数量: "50",
  明細金額: "50000",
};

const parsedHeaderOutput: 受注HeaderOutput = {
  受注ID: "order-uuid-001",
  受注日: "2024-01-15",
  得意先ID: "customer-uuid-001",
  得意先名: "テスト株式会社",
  合計金額: 50000,
  備考: null,
  version: 0,
};

const parsedOrderOutput: 受注Output = {
  ...parsedHeaderOutput,
  明細: [
    {
      受注明細ID: "detail-uuid-001",
      受注ID: "order-uuid-001",
      商品CD: "P001",
      商品名: "テスト商品",
      単価: 1000,
      数量: 50,
      明細金額: 50000,
    },
  ],
};

// ─── テスト ───────────────────────────────────────────

describe("受注Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.transaction.mockImplementation(
      async (fn: (tx: typeof mockTx) => Promise<void>) => fn(mockTx),
    );
  });

  // ─── Search ──────────────────────────────────────────

  describe("Search", () => {
    it("日付・キーワード未指定で受注一覧と総件数が返ること", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 1 }]),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([headerRow]),
              }),
            }),
          }),
        }),
      });

      const result = await 受注Repository.Search({ pageSize: 10 });

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(parsedHeaderOutput);
    });

    it("マッチしない場合は空配列と0が返ること", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

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

      const result = await 受注Repository.Search({ pageSize: 10 });

      expect(result.totalCount).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it("キーワード指定時にexistsサブクエリが構築されること（db.select が3回呼ばれること）", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

      // コード上の登場順1番目: exists() の引数で db.select() が呼ばれる（whereClause 構築時・同期）
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({}),
        }),
      });
      // コード上の登場順2番目: count クエリ（await）
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 1 }]),
        }),
      });
      // コード上の登場順3番目: データ取得クエリ（await）
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([headerRow]),
              }),
            }),
          }),
        }),
      });

      const result = await 受注Repository.Search({
        keyword: "テスト",
        pageSize: 10,
      });

      // exists サブクエリ分を含め db.select が3回呼ばれること
      expect(mockDb.select).toHaveBeenCalledTimes(3);
      expect(result.items[0]).toEqual(parsedHeaderOutput);
    });

    it("ページングのoffsetが正しく計算されること（page=2, pageSize=10 → offset=10）", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

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
            orderBy: vi.fn().mockReturnValue({ limit: mockLimit }),
          }),
        }),
      });

      await 受注Repository.Search({ page: 3, pageSize: 10 });
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(20);
    });
  });

  // ─── SearchById ─────────────────────────────────────────

  describe("SearchById", () => {
    it("IDに一致する受注（ヘッダ＋明細）が返ること", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

      // 1回目: 受注ヘッダ取得
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([headerRow]),
          }),
        }),
      });
      // 2回目: 受注明細取得
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([detailRow]),
        }),
      });

      const result = await 受注Repository.SearchById("order-uuid-001");

      expect(result).toEqual(parsedOrderOutput);
    });

    it("存在しないIDの場合はnullが返ること", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await 受注Repository.SearchById("nonexistent-id");

      expect(result).toBeNull();
      // ヘッダが見つからない場合は明細クエリを実行しないこと
      expect(mockDb.select).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Save (create) ───────────────────────────────────

  describe("Save (create)", () => {
    const orderData: 受注Output = {
      受注日: "2024-01-20",
      得意先ID: "customer-uuid-001",
      得意先名: "テスト株式会社",
      合計金額: 50000,
      備考: null,
      version: 0,
      明細: [
        {
          商品CD: "P001",
          商品名: "テスト商品",
          単価: 1000,
          数量: 50,
          明細金額: 50000,
        },
      ],
    };

    it("createモードでは uuidv7 で生成したIDで受注・受注明細がinsertされること", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

      const mockTxInsertValues1 = vi.fn().mockResolvedValue({});
      const mockTxInsertValues2 = vi.fn().mockResolvedValue({});
      mockTx.insert
        .mockReturnValueOnce({ values: mockTxInsertValues1 }) // 受注
        .mockReturnValueOnce({ values: mockTxInsertValues2 }); // 受注明細

      await 受注Repository.Save(orderData, "create");

      expect(mockDb.transaction).toHaveBeenCalledOnce();
      // 受注 insert に生成UUIDが使われること
      expect(mockTxInsertValues1).toHaveBeenCalledWith(
        expect.objectContaining({
          受注ID: "generated-order-uuid",
          合計金額: "50000", // 数値 → 文字列変換されること
        }),
      );
      // 受注明細 insert に生成UUIDが使われること
      expect(mockTxInsertValues2).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            受注ID: "generated-order-uuid",
            単価: "1000", // 数値 → 文字列変換されること
            数量: "50",
            明細金額: "50000",
          }),
        ]),
      );
    });
  });

  // ─── Save (edit) ─────────────────────────────────────

  describe("Save (edit)", () => {
    const orderData: 受注Output = {
      受注ID: "order-uuid-001",
      受注日: "2024-01-20",
      得意先ID: "customer-uuid-001",
      得意先名: "テスト株式会社",
      合計金額: 60000,
      備考: null,
      version: 1,
      明細: [
        {
          商品CD: "P002",
          商品名: "更新後商品",
          単価: 2000,
          数量: 30,
          明細金額: 60000,
        },
      ],
    };

    it("editモードではversionをインクリメントして受注を更新し、明細を再作成すること", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

      const mockTxUpdateWhere = vi.fn().mockResolvedValue({ rowCount: 1 });
      const mockTxUpdateSet = vi
        .fn()
        .mockReturnValue({ where: mockTxUpdateWhere });
      mockTx.update.mockReturnValueOnce({ set: mockTxUpdateSet });

      const mockTxDeleteWhere = vi.fn().mockResolvedValue({});
      mockTx.delete.mockReturnValueOnce({ where: mockTxDeleteWhere });

      const mockTxInsertValues = vi.fn().mockResolvedValue({});
      mockTx.insert.mockReturnValueOnce({ values: mockTxInsertValues });

      await 受注Repository.Save(orderData, "edit", "order-uuid-001");

      expect(mockDb.transaction).toHaveBeenCalledOnce();
      // version がインクリメントされること
      expect(mockTxUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ version: 2 }), // version(1) + 1
      );
      // 既存の明細が削除されること
      expect(mockTx.delete).toHaveBeenCalledOnce();
      // 新しい明細がinsertされること
      expect(mockTxInsertValues).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            受注ID: "order-uuid-001",
            商品CD: "P002",
            単価: "2000",
            数量: "30",
            明細金額: "60000",
          }),
        ]),
      );
    });

    it("楽観的ロック競合（rowCount=0）はエラーがスローされること", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

      mockTx.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 0 }),
        }),
      });

      await expect(
        受注Repository.Save(orderData, "edit", "order-uuid-001"),
      ).rejects.toThrow(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    });
  });

  // ─── Delete ──────────────────────────────────────────

  describe("Delete", () => {
    it("IDとversionの条件でdeleteされること", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

      const mockWhere = vi.fn().mockResolvedValue({ rowCount: 1 });
      mockDb.delete.mockReturnValueOnce({ where: mockWhere });

      await 受注Repository.Delete("order-uuid-001", 0);

      expect(mockDb.delete).toHaveBeenCalledOnce();
      expect(mockWhere).toHaveBeenCalledOnce();
    });

    it("対象が存在しない場合（rowCount=0）はエラーがスローされること", async () => {
      const { 受注Repository } = await import("@/db/repository/受注Repository");

      mockDb.delete.mockReturnValueOnce({
        where: vi.fn().mockResolvedValue({ rowCount: 0 }),
      });

      await expect(受注Repository.Delete("order-uuid-001", 0)).rejects.toThrow(
        "対象のデータは既に別のユーザーによって更新または削除されています。",
      );
    });
  });
});
