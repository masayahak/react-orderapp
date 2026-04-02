import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";

export const auth = betterAuth({
  // 1) レート制限 — ブルートフォース攻撃対策
  // 本番環境では storage: "database" または customStorage で Redis を推奨
  rateLimit: {
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 }, // 60秒間に5回まで
    },
  },

  // 3) 認証情報は `drizzle` 経由の `Postgres` へ格納する
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // 4) 認証はemail + パスワードのみとする
  emailAndPassword: {
    enabled: true,
  },

  // 5) セッションの有効期限を設定する
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7日 (seconds)
    updateAge: 60 * 60 * 24 * 1, // 1日ごとに有効期限を更新
  },

  // 6) プラグインを設定する
  plugins: [
    admin(), // 管理者機能プラグイン
    nextCookies(), // 常に配列の最後に配置
  ],
});
