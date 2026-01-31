import { z } from "zod";

export const 受注明細Model = z.object({
  受注明細ID: z.string().optional(),
  受注ID: z.string().optional(),
  商品CD: z.string().min(1, "商品は必須です"),
  商品名: z.string().min(1, "商品名は必須です"),
  単価: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number())
    .refine((v) => v >= 0, "0以上で入力してください"),
  数量: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number())
    .refine((v) => v > 0, "1以上で入力してください"),
  明細金額: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number())
    .refine((v) => v >= 0, "0以上で入力してください"),
});

export const 受注Model = z.object({
  受注ID: z.string().optional(),
  受注日: z.string().min(1, "受注日を選択してください"),
  得意先ID: z.string().min(1, "得意先は必須です"),
  得意先名: z.string().min(1, "得意先名は必須です"),
  合計金額: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number())
    .refine((v) => v >= 0, "0以上で入力してください"),
  備考: z.string().optional().nullable(),
  version: z.number().default(0),
  明細: z.array(受注明細Model).min(1, "明細を1件以上入力してください"),
});

// 型定義
export type 受注明細Input = z.input<typeof 受注明細Model>;
export type 受注明細Output = z.output<typeof 受注明細Model>;

export type 受注Input = z.input<typeof 受注Model>;
export type 受注Output = z.output<typeof 受注Model>;

// 一覧画面（検索結果）用のスキーマ：明細を省略する
export const 受注HeaderModel = 受注Model.omit({ 明細: true });
export type 受注HeaderOutput = z.output<typeof 受注HeaderModel>;
