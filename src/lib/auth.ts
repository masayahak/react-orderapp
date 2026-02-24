import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";

export const auth = betterAuth({
  // 1) 認証情報は `drizzle` 経由の `Postgres` へ格納する
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // 2) 認証はemail + パスワードのみとする
  emailAndPassword: {
    enabled: true,
  },

  // 3) セッションの有効期限を設定する
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7日 (seconds)
    updateAge: 60 * 60 * 24 * 1, // 1日ごとに有効期限を更新
  },

  // 4) プラグインを設定する
  plugins: [
    admin(), // 管理者機能プラグイン
    nextCookies(), // 常に配列の最後に配置
  ],
});
