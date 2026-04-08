import { z } from "zod";

// 日付形式 (yyyy-MM-dd) かつ 実在する日付であることをバリデーション
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式(yyyy-MM-dd)で入力してください")
  .refine((val) => {
    const [y, m, d] = val.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    // JSのDateは「2月31日」を「3月3日」などに自動変換するため、
    // 入力値と変換後の値が一致するかで実在性を判定する
    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );
  }, "実在しない日付です");
