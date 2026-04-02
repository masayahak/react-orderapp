import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "@/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期値が即座に返されること", () => {
    const { result } = renderHook(() => useDebounce("初期値", 300));
    expect(result.current).toBe("初期値");
  });

  it("delay経過後に値が更新されること", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "初期", delay: 300 } },
    );

    expect(result.current).toBe("初期");

    rerender({ value: "更新後", delay: 300 });

    // delay前はまだ古い値
    expect(result.current).toBe("初期");

    // delay経過後に値が更新される
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("更新後");
  });

  it("delay前に再度値が変わった場合はタイマーがリセットされること", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "最初", delay: 300 } },
    );

    rerender({ value: "途中1", delay: 300 });

    // 150ms経過（まだdelayに達していない）
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("最初");

    // さらに変更（タイマーリセット）
    rerender({ value: "途中2", delay: 300 });

    // さらに150ms経過（リセット後から150msなのでまだ未達）
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("最初");

    // 残りの150ms経過で合計300msになりdebounce完了
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("途中2");
  });

  it("delayのデフォルト値が300msであること", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "初期" } },
    );

    rerender({ value: "変更後" });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("初期");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("変更後");
  });

  it("カスタムdelayが正しく機能すること", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "初期", delay: 1000 } },
    );

    rerender({ value: "変更後", delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe("初期");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("変更後");
  });

  it("数値型の値もデバウンスできること", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } },
    );

    rerender({ value: 42, delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(42);
  });

  it("オブジェクト型の値もデバウンスできること", () => {
    const initial = { name: "初期" };
    const updated = { name: "更新後" };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initial, delay: 300 } },
    );

    rerender({ value: updated, delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toEqual({ name: "更新後" });
  });
});
