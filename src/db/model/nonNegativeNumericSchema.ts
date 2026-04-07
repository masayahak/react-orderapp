import { z } from "zod";

export const nonNegativeNumericSchema = (requiredMsg: string) =>
  z
    // DB取得は number、画面入力は string で来るため両方を受け付ける
    .union([z.number(), z.string()])
    .refine((v) => String(v).trim() !== "", requiredMsg)
    // ここで number へ強制変換
    .pipe(z.coerce.number())
    .refine((v) => !Number.isNaN(v), "数値を入力してください")
    .refine((v) => v >= 0, "0以上で入力してください");
