import { describe, expect, it } from "vitest";

import {
  formatDateJpLocal,
  formatJpy,
  formatNumber,
  format円,
  format円Large,
} from "@/lib/formatters";

// ─── formatJpy ───────────────────────────────────────────

describe("formatJpy", () => {
  it("整数をIntl通貨形式にフォーマットすること", () => {
    expect(formatJpy.format(1000)).toBe("￥1,000");
  });

  it("0を￥0にフォーマットすること", () => {
    expect(formatJpy.format(0)).toBe("￥0");
  });

  it("大きな数値に3桁区切りが適用されること", () => {
    expect(formatJpy.format(1234567)).toBe("￥1,234,567");
  });
});

// ─── formatNumber ───────────────────────────────────────────

describe("formatNumber", () => {
  it("3桁区切りでフォーマットすること", () => {
    expect(formatNumber(1000)).toBe("1,000");
  });

  it("0を「0」にフォーマットすること", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("大きな数値に3桁区切りが適用されること", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

// ─── format円 ───────────────────────────────────────────

describe("format円", () => {
  it("9,999以下は「X円」表示すること", () => {
    expect(format円(0)).toBe("0円");
    expect(format円(9999)).toBe("9,999円");
  });

  it("10,000（万円境界）は「1万円」になること", () => {
    expect(format円(10000)).toBe("1万円");
  });

  it("万円スケールでフォーマットすること", () => {
    expect(format円(50000)).toBe("5万円");
    expect(format円(99990000)).toBe("9,999万円");
  });

  it("100,000,000（億円境界）は「1億円」になること", () => {
    expect(format円(100000000)).toBe("1億円");
  });

  it("億円スケールでフォーマットすること", () => {
    expect(format円(100000000)).toBe("1億円");
    expect(format円(200000000)).toBe("2億円");
    expect(format円(150000000)).toBe("1.5億円");
  });

  it("format円Large と異なり億の小数桁数が多いこと", () => {
    // Intl.NumberFormat デフォルトの maximumFractionDigits=3 で丸められる
    expect(format円(123450000)).toBe("1.235億円");
    // format円Large は maximumFractionDigits=1 で丸める
    expect(format円Large(123450000)).toBe("1.2億円");
  });
});

// ─── format円Large ───────────────────────────────────────────

describe("format円Large", () => {
  it("9,999以下は「X円」表示すること", () => {
    expect(format円Large(0)).toBe("0円");
    expect(format円Large(9999)).toBe("9,999円");
  });

  it("10,000（万円境界）は「1万円」になること", () => {
    expect(format円Large(10000)).toBe("1万円");
  });

  it("万円スケールは小数なしでフォーマットすること", () => {
    expect(format円Large(55000)).toBe("6万円");
  });

  it("100,000,000（億円境界）は「1億円」になること", () => {
    expect(format円Large(100000000)).toBe("1億円");
  });

  it("億円スケールは小数1桁でフォーマットすること", () => {
    expect(format円Large(150000000)).toBe("1.5億円");
    expect(format円Large(1230000000)).toBe("12.3億円");
  });

  it("億円スケールで小数第2位が四捨五入されること", () => {
    expect(format円Large(1250000000)).toBe("12.5億円");
    expect(format円Large(1260000000)).toBe("12.6億円");
  });
});

// ─── formatDateJpLocal ───────────────────────────────────────────

describe("formatDateJpLocal", () => {
  it("yyyy-MM-dd 形式にフォーマットすること", () => {
    expect(formatDateJpLocal(new Date(2026, 3, 15))).toBe("2026-04-15");
  });

  it("月・日が1桁の場合ゼロ埋めすること", () => {
    expect(formatDateJpLocal(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("無効な日付は空文字を返すこと", () => {
    expect(formatDateJpLocal(new Date("invalid"))).toBe("");
  });
});
