import { describe, expect, it } from "vitest";

import { 得意先Model } from "@/db/model/得意先Model";

const validCustomer = {
  得意先名: "テスト株式会社",
  version: 0,
};

describe("得意先Model", () => {
  it("正常な得意先データが通ること", () => {
    const result = 得意先Model.safeParse(validCustomer);
    expect(result.success).toBe(true);
  });

  it("得意先IDはオプショナルであること（新規登録時）", () => {
    const result = 得意先Model.safeParse(validCustomer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.得意先ID).toBeUndefined();
    }
  });

  it("得意先IDを含む場合も有効であること（更新時）", () => {
    const result = 得意先Model.safeParse({
      ...validCustomer,
      得意先ID: "customer-uuid-001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.得意先ID).toBe("customer-uuid-001");
    }
  });

  it("得意先名が空の場合はエラーになること", () => {
    const result = 得意先Model.safeParse({ ...validCustomer, 得意先名: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes("得意先名")),
      ).toBe(true);
    }
  });

  it("電話番号はオプショナルであること", () => {
    const result = 得意先Model.safeParse(validCustomer);
    expect(result.success).toBe(true);
  });

  it("電話番号がnullの場合も有効であること", () => {
    const result = 得意先Model.safeParse({ ...validCustomer, 電話番号: null });
    expect(result.success).toBe(true);
  });

  it("電話番号に文字列が設定された場合も有効であること", () => {
    const result = 得意先Model.safeParse({
      ...validCustomer,
      電話番号: "090-1234-5678",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.電話番号).toBe("090-1234-5678");
    }
  });

  it("備考はオプショナルであること", () => {
    const result = 得意先Model.safeParse(validCustomer);
    expect(result.success).toBe(true);
  });

  it("備考がnullの場合も有効であること", () => {
    const result = 得意先Model.safeParse({ ...validCustomer, 備考: null });
    expect(result.success).toBe(true);
  });

  it("備考に文字列が設定された場合も有効であること", () => {
    const result = 得意先Model.safeParse({
      ...validCustomer,
      備考: "重要顧客",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.備考).toBe("重要顧客");
    }
  });

  it("versionのデフォルト値が0であること", () => {
    const { version: _, ...rest } = validCustomer;
    const result = 得意先Model.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(0);
    }
  });

  it("全フィールドが揃っている場合も有効であること", () => {
    const result = 得意先Model.safeParse({
      得意先ID: "customer-uuid-001",
      得意先名: "ハカマタソフト株式会社",
      電話番号: "03-1234-5678",
      備考: "取引条件: 月末締め翌月払い",
      version: 5,
    });
    expect(result.success).toBe(true);
  });
});
