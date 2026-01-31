"use client";

import { useEffect, useState } from "react";

/**
 * 指定されたミリ秒（delay）だけ値の更新を遅延させるフック
 * @param value 監視する値
 * @param delay 遅延させるミリ秒 (デフォルト: 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // delay ミリ秒後にステートを更新するタイマーをセット
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 次回実行時、またはコンポーネントのアンマウント時にタイマーをクリア
    // これにより、連続で入力されている間は set が走らない
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
