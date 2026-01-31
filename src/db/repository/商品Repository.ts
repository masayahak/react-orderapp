import "server-only"; // クライアント側に混入したらビルドエラーにする
import { db } from "@/db/drizzle";
import { and, eq, ilike, or, asc, count } from "drizzle-orm";
import { 商品Output, 商品Model } from "../model/商品Model";
import { 商品 } from "../schema";

export const 商品Repository = {
  async Search(
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

  async SearchBy(商品CD: string): Promise<商品Output | null> {
    const results = await db
      .select()
      .from(商品)
      .where(eq(商品.商品CD, 商品CD))
      .limit(1);

    const target = results[0];
    return target ? 商品Model.parse(target) : null;
  },

  async Insert(データ: 商品Output) {
    return await db
      .insert(商品)
      .values({
        ...データ,
        単価: データ.単価.toString(), // 輸送ポッド(string)へ変換
        version: 1, // 初期バージョン
      })
      .returning();
  },

  async Update(
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

    // rowCount 0 は「where句に一致しなかった ＝ 他者が更新済み」を意味する
    if (result.rowCount === 0) {
      throw new Error(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    }
    return result;
  },

  async Delete(商品CD: string, 現在のversion: number) {
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
