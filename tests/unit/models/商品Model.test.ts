import { describe, expect, it } from "vitest";

import { 商品Model, 商品Output } from "@/db/model/商品Model";

const validProduct: 商品Output = {
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
    if (result.success) return;

    const issue = result.error!.issues.filter((i) => i.path.includes("商品CD"));
    expect(issue.length).toBeGreaterThanOrEqual(1);
  });

  it("商品名が空の場合はエラーになること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 商品名: "" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const issue = result.error!.issues.filter((i) => i.path.includes("商品名"));
    expect(issue.length).toBeGreaterThanOrEqual(1);
  });

  it("単価が文字列数字でも数値に変換されること", () => {
    const result = 商品Model.safeParse({ ...validProduct, 単価: "2500" });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.単価).toBe(2500);
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
    if (!result.success) return;

    expect(result.data.備考).toBe("取扱注意商品");
  });

  it("versionのデフォルト値が0であること", () => {
    const { version: _, ...rest } = validProduct;
    const result = 商品Model.safeParse(rest);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.version).toBe(0);
  });

});
