import "server-only"; // クライアント側に混入したらビルドエラーにする

import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { uuidv7 } from "uuidv7"; // UUID v7 生成用

import { db } from "@/db/drizzle";

import { 得意先Model, 得意先Output } from "../model/得意先Model";
import { 得意先 } from "../schema";

export const 得意先Repository = {
  async Search(
    キーワード: string,
    page: number = 1,
    pageSize: number,
  ): Promise<{ items: 得意先Output[]; totalCount: number }> {
    const pattern = `%${キーワード}%`;
    const offset = (page - 1) * pageSize;

    // 検索対象は「名称」と「電話番号」
    const whereClause = or(
      ilike(得意先.得意先名, pattern),
      ilike(得意先.電話番号, pattern),
    );

    // 1. 全件数を取得
    const countResult = await db
      .select({ value: count() })
      .from(得意先)
      .where(whereClause);
    const totalCount = countResult[0].value;

    // 2. 該当ページ分を取得（名前順でソート）
    const results = await db
      .select()
      .from(得意先)
      .where(whereClause)
      .orderBy(asc(得意先.得意先名))
      .limit(pageSize)
      .offset(offset);

    return {
      items: results.map((r) => 得意先Model.parse(r)),
      totalCount,
    };
  },

  async SearchBy(得意先ID: string): Promise<得意先Output | null> {
    const results = await db
      .select()
      .from(得意先)
      .where(eq(得意先.得意先ID, 得意先ID))
      .limit(1);

    const target = results[0];
    return target ? 得意先Model.parse(target) : null;
  },

  async Insert(データ: Omit<得意先Output, "得意先ID">) {
    return await db
      .insert(得意先)
      .values({
        ...データ,
        得意先ID: uuidv7(), // ここで UUID v7 を採番！
        version: 0,
      })
      .returning();
  },

  async Update(
    得意先ID: string,
    現在のversion: number,
    データ: Omit<得意先Output, "得意先ID" | "version">,
  ) {
    const result = await db
      .update(得意先)
      .set({
        ...データ,
        version: 現在のversion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(eq(得意先.得意先ID, 得意先ID), eq(得意先.version, 現在のversion)),
      );

    if (result.rowCount === 0) {
      throw new Error(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    }
    return result;
  },

  async Delete(得意先ID: string, 現在のversion: number) {
    const result = await db
      .delete(得意先)
      .where(
        and(eq(得意先.得意先ID, 得意先ID), eq(得意先.version, 現在のversion)),
      );

    if (result.rowCount === 0) {
      throw new Error(
        "対象のデータは別のユーザーによって更新されたか、削除されています。",
      );
    }
    return result;
  },
};
