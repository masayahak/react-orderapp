import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),
  PAGE_ROW_COUNT: z.coerce.number().int().positive().default(20),
});

// サーバー起動時に一度だけ実行される
// エラーを検出した場合、そもそもwebサーバーとして起動しない
export const env = schema.parse(process.env);
