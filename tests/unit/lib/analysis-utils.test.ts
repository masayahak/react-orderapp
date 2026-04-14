import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AnalysisParams,
  analysisParamsSchema,
  calculateAnalysisParams,
  generateEmptyTrendData,
  getAnalysisDefaults,
} from "@/lib/analysis-utils";

// ─── analysisParamsSchema ─────────────────────────────────

describe("analysisParamsSchema", () => {
  describe("preset", () => {
    it("有効な preset を受け付けること", () => {
      const result = analysisParamsSchema.parse({
        preset: "month",
        from: "2026-04-01",
        to: "2026-04-30",
      });
      expect(result.preset).toBe("month");
    });

    it("不正な preset は 'month' にフォールバックすること", () => {
      const result = analysisParamsSchema.parse({
        preset: "invalid",
        from: "2026-04-01",
        to: "2026-04-30",
      });
      expect(result.preset).toBe("month");
    });
  });

  describe("interval の導出", () => {
    it("week/month は interval が 'day' になること", () => {
      const week = analysisParamsSchema.parse({
        preset: "week",
        from: "2026-04-09",
        to: "2026-04-15",
      });
      const month = analysisParamsSchema.parse({
        preset: "month",
        from: "2026-04-01",
        to: "2026-04-30",
      });
      expect(week.interval).toBe("day");
      expect(month.interval).toBe("day");
    });

    it("year は interval が 'month' になること", () => {
      const result = analysisParamsSchema.parse({
        preset: "year",
        from: "2026-01-01",
        to: "2026-12-31",
      });
      expect(result.interval).toBe("month");
    });
  });

  describe("direction", () => {
    it("省略時は 'current' になること", () => {
      const result = analysisParamsSchema.parse({
        preset: "month",
        from: "2026-04-01",
        to: "2026-04-30",
      });
      expect(result.direction).toBe("current");
    });
  });
});

// ─── getAnalysisDefaults ─────────────────────────────────

describe("getAnalysisDefaults", () => {
  beforeEach(() => {
    // 2026-04-15（水曜）にピン留め
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T10:00:00+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("week: 当日から遡って7日間になること", () => {
    const result = getAnalysisDefaults("week");
    expect(result.duration.from).toBe("2026-04-09");
    expect(result.duration.to).toBe("2026-04-15");
    expect(result.interval).toBe("day");
  });

  it("month: 当月1日〜末日になること", () => {
    const result = getAnalysisDefaults("month");
    expect(result.duration.from).toBe("2026-04-01");
    expect(result.duration.to).toBe("2026-04-30");
    expect(result.interval).toBe("day");
  });

  it("year: 当年1月1日〜12月31日になること", () => {
    const result = getAnalysisDefaults("year");
    expect(result.duration.from).toBe("2026-01-01");
    expect(result.duration.to).toBe("2026-12-31");
    expect(result.interval).toBe("month");
  });
});

// ─── generateEmptyTrendData ─────────────────────────────────

describe("generateEmptyTrendData", () => {
  it("day 単位で期間内の全日を生成すること", () => {
    const result = generateEmptyTrendData(
      { from: "2026-04-01", to: "2026-04-03" },
      "day",
    );
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      period: "2026-04-01",
      totalAmount: 0,
      count: 0,
    });
    expect(result[1]).toEqual({
      period: "2026-04-02",
      totalAmount: 0,
      count: 0,
    });
    expect(result[2]).toEqual({
      period: "2026-04-03",
      totalAmount: 0,
      count: 0,
    });
  });

  it("month 単位で期間内の全月を生成すること", () => {
    const result = generateEmptyTrendData(
      { from: "2026-01-01", to: "2026-03-01" },
      "month",
    );
    expect(result).toHaveLength(3);
    expect(result[0].period).toBe("2026-01-01");
    expect(result[1].period).toBe("2026-02-01");
    expect(result[2].period).toBe("2026-03-01");
  });

  it("全要素の totalAmount と count が 0 であること", () => {
    const result = generateEmptyTrendData(
      { from: "2026-04-01", to: "2026-04-05" },
      "day",
    );
    result.forEach((row) => {
      expect(row.totalAmount).toBe(0);
      expect(row.count).toBe(0);
    });
  });

  it("from と to が同日の場合は1件になること", () => {
    const result = generateEmptyTrendData(
      { from: "2026-04-15", to: "2026-04-15" },
      "day",
    );
    expect(result).toHaveLength(1);
    expect(result[0].period).toBe("2026-04-15");
  });
});

// ─── calculateAnalysisParams ─────────────────────────────────

// テスト用の基準パラメータ（2026年4月・月表示）
const baseMonth: AnalysisParams = {
  preset: "month",
  interval: "day",
  direction: "current",
  duration: { from: "2026-04-01", to: "2026-04-30" },
};

const baseWeek: AnalysisParams = {
  preset: "week",
  interval: "day",
  direction: "current",
  duration: { from: "2026-04-09", to: "2026-04-15" },
};

const baseYear: AnalysisParams = {
  preset: "year",
  interval: "month",
  direction: "current",
  duration: { from: "2026-01-01", to: "2026-12-31" },
};

describe("calculateAnalysisParams", () => {
  describe("period 移動（month）", () => {
    it("next で翌月に移動すること", () => {
      const result = calculateAnalysisParams(baseMonth, { direction: "next" });
      expect(result.duration.from).toBe("2026-05-01");
      expect(result.duration.to).toBe("2026-05-31");
    });

    it("prev で前月に移動すること", () => {
      const result = calculateAnalysisParams(baseMonth, { direction: "prev" });
      expect(result.duration.from).toBe("2026-03-01");
      expect(result.duration.to).toBe("2026-03-31");
    });

    it("月末日が正しく計算されること（2月）", () => {
      const feb: AnalysisParams = {
        ...baseMonth,
        duration: { from: "2026-03-01", to: "2026-03-31" },
      };
      const result = calculateAnalysisParams(feb, { direction: "prev" });
      expect(result.duration.from).toBe("2026-02-01");
      expect(result.duration.to).toBe("2026-02-28");
    });
  });

  describe("period 移動（week）", () => {
    it("next で翌週（+7日）に移動すること", () => {
      const result = calculateAnalysisParams(baseWeek, { direction: "next" });
      expect(result.duration.from).toBe("2026-04-16");
      expect(result.duration.to).toBe("2026-04-22");
    });

    it("prev で前週（-7日）に移動すること", () => {
      const result = calculateAnalysisParams(baseWeek, { direction: "prev" });
      expect(result.duration.from).toBe("2026-04-02");
      expect(result.duration.to).toBe("2026-04-08");
    });
  });

  describe("period 移動（year）", () => {
    it("next で翌年に移動すること", () => {
      const result = calculateAnalysisParams(baseYear, { direction: "next" });
      expect(result.duration.from).toBe("2027-01-01");
      expect(result.duration.to).toBe("2027-12-31");
    });

    it("prev で前年に移動すること", () => {
      const result = calculateAnalysisParams(baseYear, { direction: "prev" });
      expect(result.duration.from).toBe("2025-01-01");
      expect(result.duration.to).toBe("2025-12-31");
    });
  });

  describe("preset 切り替え", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-15T10:00:00+09:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("month → year に切り替えると interval が 'month' になること", () => {
      const result = calculateAnalysisParams(baseMonth, { preset: "year" });
      expect(result.preset).toBe("year");
      expect(result.interval).toBe("month");
      expect(result.duration.from).toBe("2026-01-01");
      expect(result.duration.to).toBe("2026-12-31");
    });

    it("year → week に切り替えると interval が 'day' になること", () => {
      const result = calculateAnalysisParams(baseYear, { preset: "week" });
      expect(result.preset).toBe("week");
      expect(result.interval).toBe("day");
    });
  });

  describe("direction のリセット", () => {
    it("移動後の direction は 'current' にリセットされること", () => {
      const result = calculateAnalysisParams(baseMonth, { direction: "next" });
      expect(result.direction).toBe("current");
    });
  });
});
