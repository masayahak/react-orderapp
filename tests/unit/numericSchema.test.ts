import { describe, expect, it } from "vitest";

import { numericSchema } from "@/db/model/共通チェック";

const schema = numericSchema("入力してください");

describe("numericSchema", () => {
  // =============================================
  // 正常系
  // =============================================
  describe("正常系: 有効な値を受け入れる", () => {
    it("number 型の正の整数を受け入れる", () => {
      const result = schema.safeParse(100);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe(100);
    });

    it("number 型の 0 を受け入れる", () => {
      const result = schema.safeParse(0);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe(0);
    });

    it("文字列の数値('42')を受け入れ、number 型に変換する", () => {
      const result = schema.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe(42);
    });

    it("文字列の '0' を受け入れる", () => {
      const result = schema.safeParse("0");
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe(0);
    });

    it("小数点を含む文字列('3.14')を受け入れる", () => {
      const result = schema.safeParse("3.14");
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBeCloseTo(3.14);
    });

    it("大きな整数(1000000)を受け入れる", () => {
      const result = schema.safeParse(1000000);
      expect(result.success).toBe(true);
    });
  });

  // =============================================
  // 異常系: 必須チェック
  // =============================================
  describe("異常系: 必須チェック（空値）", () => {
    it("空文字('') は必須エラーになる", () => {
      const result = schema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("入力してください");
      }
    });

    it("スペースのみの文字列(' ') は必須エラーになる", () => {
      const result = schema.safeParse(" ");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("入力してください");
      }
    });
  });

  // =============================================
  // 異常系: 数値チェック
  // =============================================
  describe("異常系: 数値チェック", () => {
    it("アルファベット文字列('abc') は数値エラーになる", () => {
      const result = schema.safeParse("abc");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid input: expected number, received NaN");
      }
    });

    it("数字と混在した文字列('12abc') は数値エラーになる", () => {
      const result = schema.safeParse("12abc");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid input: expected number, received NaN");
      }
    });
  });

  // =============================================
  // 異常系: 範囲チェック
  // =============================================
  describe("異常系: 範囲チェック（0以上）", () => {
    it("負の数値(-1) は 0以上エラーになる", () => {
      const result = schema.safeParse(-1);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("0以上で入力してください");
      }
    });

    it("負数の文字列('-10') は 0以上エラーになる", () => {
      const result = schema.safeParse("-10");
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("0以上で入力してください");
      }
    });
  });
});
