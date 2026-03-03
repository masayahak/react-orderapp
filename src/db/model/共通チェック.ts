import { z } from "zod";

export const numericSchema = (requiredMsg: string) =>
  z
    .union([z.number(), z.string()])
    .refine((v) => String(v).trim() !== "", requiredMsg)
    .pipe(z.coerce.number())
    .refine((v) => !Number.isNaN(v), "数値を入力してください")
    .refine((v) => v >= 0, "0以上で入力してください");
