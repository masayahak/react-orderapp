import { z } from "zod";

import { numericSchema } from "./共通チェック";

export const 商品Model = z.object({
  商品CD: z.string().min(1, "必須"),
  商品名: z.string().min(1, "必須"),
  単価: numericSchema("単価は必須です"),
  備考: z.string().optional().nullable(),
  version: z.number().default(0),
});

// 入力時の型（フォーム管理・UI用）
export type 商品Input = z.input<typeof 商品Model>;
// 出力時の型（アプリケーションロジック・完成品）
export type 商品Output = z.output<typeof 商品Model>;
