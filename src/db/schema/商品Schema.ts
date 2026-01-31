import { z } from "zod";

export const 商品Schema = z.object({
  商品CD: z.string().min(1, "必須"),
  商品名: z.string().min(1, "必須"),
  単価: z
    .union([z.number(), z.string()]) // 入力時の曖昧さを許容
    .pipe(z.coerce.number()) // 数値へ強制変換
    .refine((v) => v >= 0, "0以上で入力してください"),
  備考: z.string().optional().nullable(),
  version: z.number().default(0),
});

// 入力時の型（フォーム管理・UI用）
export type 商品Input = z.input<typeof 商品Schema>;
// 出力時の型（アプリケーションロジック・完成品）
export type 商品Output = z.output<typeof 商品Schema>;
