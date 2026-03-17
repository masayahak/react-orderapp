import { describe, expect, it } from "vitest";

import {
  type AnalysisParams,
  calculateAnalysisParams,
  dateFormatJPLocal,
  formatCurrency,
  formatNumber,
  generateEmptyTrendData,
  getAnalysisDefaults,
} from "@/lib/analysis-utils";

// =============================================
// dateFormatJPLocal
// =============================================
describe("dateFormatJPLocal", () => {
  it("有効な日付を yyyy-MM-dd 形式で返す", () => {
    expect(dateFormatJPLocal(new Date(2025, 0, 1))).toBe("2025-01-01");
    expect(dateFormatJPLocal(new Date(2025, 11, 31))).toBe("2025-12-31");
    expect(dateFormatJPLocal(new Date(2024, 1, 29))).toBe("2024-02-29"); // うるう年
  });

  it("月・日が1桁のとき0埋めする", () => {
    expect(dateFormatJPLocal(new Date(2025, 2, 5))).toBe("2025-03-05");
  });

  it("無効な日付 (NaN) のとき空文字を返す", () => {
    expect(dateFormatJPLocal(new Date("invalid"))).toBe("");
  });
});

// =============================================
// formatNumber
// =============================================
describe("formatNumber", () => {
  it("1000 を '1,000' にフォーマットする", () => {
    expect(formatNumber(1000)).toBe("1,000");
  });

  it("0 を '0' にフォーマットする", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("1000000 を '1,000,000' にフォーマットする", () => {
    expect(formatNumber(1000000)).toBe("1,000,000");
  });

  it("小数点以下がある数値もフォーマットする", () => {
    // Intl.NumberFormat('ja-JP') は小数点を保持する
    expect(formatNumber(1234.5)).toBe("1,234.5");
  });
});

// =============================================
// formatCurrency
// =============================================
describe("formatCurrency", () => {
  it("9,999 円以下はそのまま '〇〇〇円' で返す", () => {
    expect(formatCurrency(0)).toBe("0円");
    expect(formatCurrency(999)).toBe("999円");
    expect(formatCurrency(9999)).toBe("9,999円");
  });

  it("10,000 以上は万円単位に変換する", () => {
    expect(formatCurrency(10000)).toBe("1万円");
    expect(formatCurrency(50000)).toBe("5万円");
    expect(formatCurrency(99999999)).toBe("10,000万円"); // NumberFormat('ja-JP').format(9999.9999) = "10,000"
  });

  it("100,000,000 以上は億円単位に変換する", () => {
    expect(formatCurrency(100000000)).toBe("1億円");
    expect(formatCurrency(500000000)).toBe("5億円");
  });
});

// =============================================
// generateEmptyTrendData
// =============================================
describe("generateEmptyTrendData", () => {
  it("day 間隔で正しい日数分のデータを生成する", () => {
    const result = generateEmptyTrendData(
      { from: "2025-01-01", to: "2025-01-07" },
      "day",
    );
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({
      period: "2025-01-01",
      totalAmount: 0,
      count: 0,
    });
    expect(result[6]).toEqual({
      period: "2025-01-07",
      totalAmount: 0,
      count: 0,
    });
  });

  it("month 間隔で正しい月数分のデータを生成する", () => {
    const result = generateEmptyTrendData(
      { from: "2025-01-01", to: "2025-03-01" },
      "month",
    );
    expect(result).toHaveLength(3);
    expect(result[0].period).toBe("2025-01-01");
    expect(result[1].period).toBe("2025-02-01");
    expect(result[2].period).toBe("2025-03-01");
  });

  it("from と to が同日のとき 1件を返す", () => {
    const result = generateEmptyTrendData(
      { from: "2025-06-15", to: "2025-06-15" },
      "day",
    );
    expect(result).toHaveLength(1);
    expect(result[0].period).toBe("2025-06-15");
  });

  it("全ての entry は totalAmount:0, count:0 である", () => {
    const result = generateEmptyTrendData(
      { from: "2025-01-01", to: "2025-01-03" },
      "day",
    );
    result.forEach((entry) => {
      expect(entry.totalAmount).toBe(0);
      expect(entry.count).toBe(0);
    });
  });
});

// =============================================
// calculateAnalysisParams
// =============================================
describe("calculateAnalysisParams", () => {
  // ベースとなる現在の状態
  const base: AnalysisParams = {
    preset: "month",
    interval: "day",
    direction: "current",
    duration: { from: "2025-03-01", to: "2025-03-31" },
  };

  describe("プリセット変更（タブ切り替え）", () => {
    it("week に変更すると interval が day になる", () => {
      const result = calculateAnalysisParams(base, { preset: "week" });
      expect(result.preset).toBe("week");
      expect(result.interval).toBe("day");
    });

    it("year に変更すると interval が month になる", () => {
      const result = calculateAnalysisParams(base, { preset: "year" });
      expect(result.preset).toBe("year");
      expect(result.interval).toBe("month");
    });

    it("プリセット変更後 direction は 'current' にリセットされる", () => {
      const result = calculateAnalysisParams(base, { preset: "week" });
      expect(result.direction).toBe("current");
    });
  });

  describe("期間移動 - week プリセット", () => {
    const weekBase: AnalysisParams = {
      preset: "week",
      interval: "day",
      direction: "current",
      duration: { from: "2025-03-10", to: "2025-03-16" },
    };

    it("next で 7日後に進む", () => {
      const result = calculateAnalysisParams(weekBase, { direction: "next" });
      expect(result.duration.from).toBe("2025-03-17");
      expect(result.duration.to).toBe("2025-03-23");
    });

    it("prev で 7日前に戻る", () => {
      const result = calculateAnalysisParams(weekBase, { direction: "prev" });
      expect(result.duration.from).toBe("2025-03-03");
      expect(result.duration.to).toBe("2025-03-09");
    });
  });

  describe("期間移動 - month プリセット", () => {
    it("next で翌月になる", () => {
      const result = calculateAnalysisParams(base, { direction: "next" });
      expect(result.duration.from).toBe("2025-04-01");
      expect(result.duration.to).toBe("2025-04-30");
    });

    it("prev で前月になる", () => {
      const result = calculateAnalysisParams(base, { direction: "prev" });
      expect(result.duration.from).toBe("2025-02-01");
      expect(result.duration.to).toBe("2025-02-28");
    });
  });

  describe("期間移動 - year プリセット", () => {
    const yearBase: AnalysisParams = {
      preset: "year",
      interval: "month",
      direction: "current",
      duration: { from: "2025-01-01", to: "2025-12-31" },
    };

    it("next で翌年になる", () => {
      const result = calculateAnalysisParams(yearBase, { direction: "next" });
      expect(result.duration.from).toBe("2026-01-01");
      expect(result.duration.to).toBe("2026-12-31");
    });

    it("prev で前年になる", () => {
      const result = calculateAnalysisParams(yearBase, { direction: "prev" });
      expect(result.duration.from).toBe("2024-01-01");
      expect(result.duration.to).toBe("2024-12-31");
    });
  });
});

// =============================================
// getAnalysisDefaults (スモークテスト)
// =============================================
describe("getAnalysisDefaults", () => {
  it("week: interval が 'day' で、from と to が 6日差である", () => {
    const { duration, interval } = getAnalysisDefaults("week");
    expect(interval).toBe("day");
    const from = new Date(duration.from.replace(/-/g, "/"));
    const to = new Date(duration.to.replace(/-/g, "/"));
    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(6);
  });

  it("month: interval が 'day' で、from が月初、to が月末", () => {
    const { duration, interval } = getAnalysisDefaults("month");
    expect(interval).toBe("day");
    expect(duration.from).toMatch(/-01$/);
    // 月末は28〜31日（月により異なる）
    const toDay = Number(duration.to.split("-")[2]);
    expect(toDay).toBeGreaterThanOrEqual(28);
  });

  it("year: interval が 'month' で、from が 1月1日、to が 12月31日", () => {
    const { duration, interval } = getAnalysisDefaults("year");
    expect(interval).toBe("month");
    expect(duration.from).toMatch(/-01-01$/);
    expect(duration.to).toMatch(/-12-31$/);
  });
});
