import { z } from "zod";

export const 得意先Model = z.object({
  得意先ID: z.string().optional(),
  得意先名: z.string().min(1, "必須項目です"),
  電話番号: z.string().optional().nullable(),
  備考: z.string().optional().nullable(),
  version: z.number().default(1),
});

// 入力時の型（フォーム管理・UI用）
export type 得意先Input = z.input<typeof 得意先Model>;
// 出力時の型（アプリケーションロジック・完成品）
export type 得意先Output = z.output<typeof 得意先Model>;
