import { describe, expect, it } from "vitest";

import { nonNegativeNumericSchema } from "@/db/model/nonNegativeNumericSchema";

const schema = nonNegativeNumericSchema("必須です");

describe("nonNegativeNumericSchema", () => {
  it("数値がそのまま通ること", () => {
    const result = schema.safeParse(1000);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toBe(1000);
  });

  it("文字列数字が数値に変換されること", () => {
    const result = schema.safeParse("2500");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toBe(2500);
  });

  it("0が有効であること", () => {
    const result = schema.safeParse(0);
    expect(result.success).toBe(true);
  });

  it("空文字の場合はエラーになること", () => {
    const result = schema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("非数値文字列の場合はエラーになること", () => {
    const result = schema.safeParse("abc");
    expect(result.success).toBe(false);
  });

  it("負の数の場合はエラーになること", () => {
    const result = schema.safeParse(-1);
    expect(result.success).toBe(false);
  });
});
