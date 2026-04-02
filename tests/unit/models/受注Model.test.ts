import { describe, expect, it } from "vitest";

import { 受注Model, 受注明細Model } from "@/db/model/受注Model";

// 正常な明細データの基本形
const validDetail = {
  商品CD: "PROD-001",
  商品名: "テスト商品",
  単価: 1000,
  数量: 2,
  明細金額: 2000,
};

// 正常な受注データの基本形
const validOrder = {
  受注日: "2024-01-15",
  得意先ID: "customer-uuid-001",
  得意先名: "テスト得意先",
  合計金額: 2000,
  version: 0,
  明細: [validDetail],
};

// ─────────────────────────────────────────────
// 受注明細Model
// ─────────────────────────────────────────────
describe("受注明細Model", () => {
  it("正常な明細データが通ること", () => {
    const result = 受注明細Model.safeParse(validDetail);
    expect(result.success).toBe(true);
  });

  it("オプショナルIDを含む明細データも有効であること", () => {
    const result = 受注明細Model.safeParse({
      ...validDetail,
      受注明細ID: "detail-uuid",
      受注ID: "order-uuid",
    });
    expect(result.success).toBe(true);
  });

  it("商品CDが空の場合はエラーになること", () => {
    const result = 受注明細Model.safeParse({ ...validDetail, 商品CD: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("商品CD"))).toBe(
        true,
      );
    }
  });

  it("商品名が空の場合はエラーになること", () => {
    const result = 受注明細Model.safeParse({ ...validDetail, 商品名: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("商品名"))).toBe(
        true,
      );
    }
  });

  it("単価が文字列数字でも数値に変換されること", () => {
    const result = 受注明細Model.safeParse({ ...validDetail, 単価: "500" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.単価).toBe(500);
    }
  });

  it("単価が0の場合も有効であること", () => {
    const result = 受注明細Model.safeParse({
      ...validDetail,
      単価: 0,
      明細金額: 0,
    });
    expect(result.success).toBe(true);
  });

  it("単価が負の場合はエラーになること", () => {
    const result = 受注明細Model.safeParse({ ...validDetail, 単価: -1 });
    expect(result.success).toBe(false);
  });

  it("数量が文字列数字でも数値に変換されること", () => {
    const result = 受注明細Model.safeParse({ ...validDetail, 数量: "3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.数量).toBe(3);
    }
  });

  it("数量が負の場合はエラーになること", () => {
    const result = 受注明細Model.safeParse({ ...validDetail, 数量: -1 });
    expect(result.success).toBe(false);
  });

  it("数量が0の場合も有効であること", () => {
    const result = 受注明細Model.safeParse({ ...validDetail, 数量: 0, 明細金額: 0 });
    expect(result.success).toBe(true);
  });

  it("明細金額が0の場合も有効であること", () => {
    const result = 受注明細Model.safeParse({ ...validDetail, 明細金額: 0 });
    expect(result.success).toBe(true);
  });

  it("単価が非数値文字列の場合はエラーになること", () => {
    const result = 受注明細Model.safeParse({ ...validDetail, 単価: "abc" });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 受注Model
// ─────────────────────────────────────────────
describe("受注Model", () => {
  it("正常な受注データが通ること", () => {
    const result = 受注Model.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it("受注IDはオプショナルであること（新規登録時）", () => {
    const { 受注ID: _, ...rest } = { ...validOrder, 受注ID: undefined };
    const result = 受注Model.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("受注IDを含む場合も有効であること（更新時）", () => {
    const result = 受注Model.safeParse({
      ...validOrder,
      受注ID: "order-uuid-001",
    });
    expect(result.success).toBe(true);
  });

  it("受注日が空の場合はエラーになること", () => {
    const result = 受注Model.safeParse({ ...validOrder, 受注日: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("受注日"))).toBe(
        true,
      );
    }
  });

  it("受注日が無効な文字列の場合はエラーになること", () => {
    const result = 受注Model.safeParse({
      ...validOrder,
      受注日: "not-a-date",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("受注日"))).toBe(
        true,
      );
    }
  });

  it("得意先IDが空の場合はエラーになること", () => {
    const result = 受注Model.safeParse({ ...validOrder, 得意先ID: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("得意先ID"))).toBe(
        true,
      );
    }
  });

  it("得意先名が空の場合はエラーになること", () => {
    const result = 受注Model.safeParse({ ...validOrder, 得意先名: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes("得意先名")),
      ).toBe(true);
    }
  });

  it("合計金額が0の場合も有効であること", () => {
    const result = 受注Model.safeParse({ ...validOrder, 合計金額: 0 });
    expect(result.success).toBe(true);
  });

  it("合計金額が文字列数字でも変換されること", () => {
    const result = 受注Model.safeParse({ ...validOrder, 合計金額: "5000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.合計金額).toBe(5000);
    }
  });

  it("明細が空配列の場合はエラーになること", () => {
    const result = 受注Model.safeParse({ ...validOrder, 明細: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("明細"))).toBe(
        true,
      );
    }
  });

  it("複数の明細行が有効であること", () => {
    const result = 受注Model.safeParse({
      ...validOrder,
      明細: [
        validDetail,
        { ...validDetail, 商品CD: "PROD-002", 商品名: "別商品" },
        { ...validDetail, 商品CD: "PROD-003", 商品名: "もう一つの商品" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("備考がnullの場合も有効であること", () => {
    const result = 受注Model.safeParse({ ...validOrder, 備考: null });
    expect(result.success).toBe(true);
  });

  it("備考が省略された場合も有効であること", () => {
    const result = 受注Model.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it("versionのデフォルト値が0であること", () => {
    const { version: _, ...rest } = validOrder;
    const result = 受注Model.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(0);
    }
  });

  it("明細内の商品CDが空の場合はエラーになること", () => {
    const result = 受注Model.safeParse({
      ...validOrder,
      明細: [{ ...validDetail, 商品CD: "" }],
    });
    expect(result.success).toBe(false);
  });
});
