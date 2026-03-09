import "server-only";

import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/drizzle";

import { 商品Model, 商品Output } from "../model/商品Model";
import { 商品 } from "../schema";

// --- 1. 内部実装用の実体 (外部からは直接見えない) ---
const _impl = {
  async search(
    キーワード: string,
    page: number = 1,
    pageSize: number,
  ): Promise<{ items: 商品Output[]; totalCount: number }> {
    const pattern = `%${キーワード}%`;
    const offset = (page - 1) * pageSize;
    const whereClause = or(
      ilike(商品.商品CD, pattern),
      ilike(商品.商品名, pattern),
    );

    // 1. 全件数を取得（ページング計算用）
    const countResult = await db
      .select({ value: count() })
      .from(商品)
      .where(whereClause);
    const totalCount = countResult[0].value;

    // 2. 該当ページ分だけ取得
    const results = await db
      .select()
      .from(商品)
      .where(whereClause)
      .orderBy(asc(商品.商品CD))
      .limit(pageSize)
      .offset(offset);

    return {
      items: results.map((r) => 商品Model.parse(r)),
      totalCount,
    };
  },

  async findByCd(商品CD: string): Promise<商品Output | null> {
    const results = await db
      .select()
      .from(商品)
      .where(eq(商品.商品CD, 商品CD))
      .limit(1);

    const target = results[0];
    return target ? 商品Model.parse(target) : null;
  },

  async insert(データ: 商品Output) {
    return await db
      .insert(商品)
      .values({
        ...データ,
        単価: データ.単価.toString(), // 輸送ポッド(string)へ変換
        version: 0, // 初期バージョン
      })
      .onConflictDoNothing({ target: 商品.商品CD })
      .returning();
  },

  async update(
    商品CD: string,
    現在のversion: number,
    データ: Omit<商品Output, "商品CD" | "version">,
  ) {
    const result = await db
      .update(商品)
      .set({
        ...データ,
        単価: データ.単価.toString(), // 輸送ポッド(string)へ変換
        version: 現在のversion + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(商品.商品CD, 商品CD), eq(商品.version, 現在のversion)));

    if (result.rowCount === 0) {
      throw new Error(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    }
    return result;
  },

  async delete(商品CD: string, 現在のversion: number) {
    const result = await db
      .delete(商品)
      .where(and(eq(商品.商品CD, 商品CD), eq(商品.version, 現在のversion)));

    if (result.rowCount === 0) {
      throw new Error(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    }
    return result;
  },
};

// --- 2. 外部公開用オブジェクト (既存のインターフェースを維持) ---
export const 商品Repository = {
  // 参照系: React.cache でメモ化
  Search: cache(_impl.search),
  SearchBy: cache(_impl.findByCd),

  // 更新系: キャッシュせずそのまま実行
  Insert: _impl.insert,
  Update: _impl.update,
  Delete: _impl.delete,
};
