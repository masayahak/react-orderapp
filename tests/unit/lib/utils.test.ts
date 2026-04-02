import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn (classNames ユーティリティ)", () => {
  it("単一のクラス名を返すこと", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("複数のクラス名をスペース区切りで結合すること", () => {
    expect(cn("text-red-500", "font-bold")).toBe("text-red-500 font-bold");
  });

  it("falsy な値を無視すること", () => {
    expect(cn("text-red-500", false, null, undefined, "font-bold")).toBe(
      "text-red-500 font-bold",
    );
  });

  it("条件付きクラス名が true の場合に含まれること", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });

  it("条件付きクラス名が false の場合に除外されること", () => {
    const isActive = false;
    expect(cn("base", isActive && "active")).toBe("base");
  });

  it("Tailwind CSS の重複クラスがマージされること（後者が優先）", () => {
    // twMerge により、同じプロパティのクラスは後者が優先される
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("Tailwind CSS のパディングクラスがマージされること", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("オブジェクト形式のクラス指定が機能すること", () => {
    expect(cn({ "text-red-500": true, "font-bold": false })).toBe(
      "text-red-500",
    );
  });

  it("配列形式のクラス指定が機能すること", () => {
    expect(cn(["text-red-500", "font-bold"])).toBe("text-red-500 font-bold");
  });

  it("引数なしの場合に空文字を返すこと", () => {
    expect(cn()).toBe("");
  });

  it("空文字のみの場合に空文字を返すこと", () => {
    expect(cn("")).toBe("");
  });
});
