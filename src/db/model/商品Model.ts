import { z } from "zod";

export const 商品Model = z.object({
  商品CD: z.string().min(1, "必須"),
  商品名: z.string().min(1, "必須"),
  単価: z
    .union([z.number(), z.string()])
    .refine((v) => v !== "", "必須") // ← 変換前に空文字をブロックする
    .pipe(z.coerce.number())
    .refine((v) => !Number.isNaN(v), "正しい数値を入力してください") // (任意) "abc"などの文字がNaNになる対策
    .refine((v) => v >= 0, "0以上で入力してください"),
  備考: z.string().optional().nullable(),
  version: z.number().default(0),
});

// 入力時の型（フォーム管理・UI用）
export type 商品Input = z.input<typeof 商品Model>;
// 出力時の型（アプリケーションロジック・完成品）
export type 商品Output = z.output<typeof 商品Model>;
