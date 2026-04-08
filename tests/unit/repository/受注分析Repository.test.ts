import { beforeEach, describe, expect, it, vi } from "vitest";

import { type AnalysisDuration, type AnalysisInterval } from "@/lib/analysis-utils";

// ─── モック設定 ───────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});

const mockDb = {
  select: vi.fn(),
};

vi.mock("@/db/drizzle", () => ({ db: mockDb }));

// ─── テストデータ ──────────────────────────────────────

const duration: AnalysisDuration = {
  from: "2024-01-01",
  to: "2024-12-31",
};

// ─── テスト ───────────────────────────────────────────

describe("受注分析Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── GetSalesTrend ───────────────────────────────────

  describe("GetSalesTrend", () => {
    it("月次集計でperiod・totalAmount・countが返ること", async () => {
      const { 受注分析Repository } =
        await import("@/db/repository/受注分析Repository");

      const expected = [
        { period: "2024-01-01T00:00:00.000Z", totalAmount: 150000, count: 3 },
        { period: "2024-02-01T00:00:00.000Z", totalAmount: 200000, count: 4 },
      ];

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(expected),
            }),
          }),
        }),
      });

      const interval: AnalysisInterval = "month";
      const result = await 受注分析Repository.GetSalesTrend(duration, interval);

      expect(mockDb.select).toHaveBeenCalledOnce();
      expect(result).toEqual(expected);
    });

    it("日次集計でも同じクエリ構造で実行されること", async () => {
      const { 受注分析Repository } =
        await import("@/db/repository/受注分析Repository");

      const expected = [
        { period: "2024-01-15T00:00:00.000Z", totalAmount: 50000, count: 1 },
      ];

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(expected),
            }),
          }),
        }),
      });

      const interval: AnalysisInterval = "day";
      const result = await 受注分析Repository.GetSalesTrend(duration, interval);

      expect(result).toEqual(expected);
    });

    it("期間内にデータがない場合は空配列が返ること", async () => {
      const { 受注分析Repository } =
        await import("@/db/repository/受注分析Repository");

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await 受注分析Repository.GetSalesTrend(duration, "month");

      expect(result).toHaveLength(0);
    });
  });

  // ─── GetTopCustomers ─────────────────────────────────

  describe("GetTopCustomers", () => {
    it("売上上位の得意先がvalue降順で返ること", async () => {
      const { 受注分析Repository } =
        await import("@/db/repository/受注分析Repository");

      const expected = [
        { name: "A株式会社", value: 500000 },
        { name: "B商事", value: 300000 },
        { name: "C工業", value: 100000 },
      ];

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(expected),
              }),
            }),
          }),
        }),
      });

      const result = await 受注分析Repository.GetTopCustomers(duration);

      expect(result).toEqual(expected);
    });

    it("limit指定でlimitが正しく渡されること", async () => {
      const { 受注分析Repository } =
        await import("@/db/repository/受注分析Repository");

      const mockLimit = vi.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({ limit: mockLimit }),
            }),
          }),
        }),
      });

      await 受注分析Repository.GetTopCustomers(duration, 3);
      expect(mockLimit).toHaveBeenCalledWith(3);
    });

    it("データがない場合は空配列が返ること", async () => {
      const { 受注分析Repository } =
        await import("@/db/repository/受注分析Repository");

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const result = await 受注分析Repository.GetTopCustomers(duration);

      expect(result).toHaveLength(0);
    });
  });

  // ─── GetTopProducts ──────────────────────────────────

  describe("GetTopProducts", () => {
    it("売上上位の商品がvalue降順で返ること（受注明細とinnerJoin）", async () => {
      const { 受注分析Repository } =
        await import("@/db/repository/受注分析Repository");

      const expected = [
        { name: "商品A", value: 800000 },
        { name: "商品B", value: 400000 },
      ];

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue(expected),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await 受注分析Repository.GetTopProducts(duration);

      expect(result).toEqual(expected);
    });

    it("limit指定でlimitが正しく渡されること", async () => {
      const { 受注分析Repository } =
        await import("@/db/repository/受注分析Repository");

      const mockLimit = vi.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({ limit: mockLimit }),
              }),
            }),
          }),
        }),
      });

      await 受注分析Repository.GetTopProducts(duration, 3);
      expect(mockLimit).toHaveBeenCalledWith(3);
    });

    it("データがない場合は空配列が返ること", async () => {
      const { 受注分析Repository } =
        await import("@/db/repository/受注分析Repository");

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await 受注分析Repository.GetTopProducts(duration);

      expect(result).toHaveLength(0);
    });
  });
});
