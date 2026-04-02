import { describe, expect, it } from "vitest";

import { 商品Model } from "@/db/model/商品Model";

const validProduct = {
  商品CD: "PROD-001",
  商品名: "テスト商品",
  単価: 1000,
  version: 0,
};

describe("商品Model", () => {
  it("正常な商品データが通ること", () => {
    const result = 商品Model.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("商品CDが空の場合はエラーになること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 商品CD: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("商品CD"))).toBe(
        true,
      );
    }
  });

  it("商品名が空の場合はエラーになること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 商品名: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("商品名"))).toBe(
        true,
      );
    }
  });

  it("単価が文字列数字でも数値に変換されること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 単価: "2500" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.単価).toBe(2500);
    }
  });

  it("単価が0の場合も有効であること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 単価: 0 });
    expect(result.success).toBe(true);
  });

  it("単価が負の場合はエラーになること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 単価: -100 });
    expect(result.success).toBe(false);
  });

  it("単価が非数値文字列の場合はエラーになること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 単価: "abc" });
    expect(result.success).toBe(false);
  });

  it("単価が空文字の場合はエラーになること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 単価: "" });
    expect(result.success).toBe(false);
  });

  it("備考がnullの場合も有効であること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 備考: null });
    expect(result.success).toBe(true);
  });

  it("備考が省略された場合も有効であること", () => {
    const result = 商品Model.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("備考に文字列が設定された場合も有効であること", () => {
    const result = 商品Model.safeParse({
      ...validProduct,
      備考: "取扱注意商品",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.備考).toBe("取扱注意商品");
    }
  });

  it("versionのデフォルト値が0であること", () => {
    const { version: _, ...rest } = validProduct;
    const result = 商品Model.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(0);
    }
  });

  it("大きな単価も有効であること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 単価: 9999999 });
    expect(result.success).toBe(true);
  });
});
