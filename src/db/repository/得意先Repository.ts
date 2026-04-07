import "server-only";

import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { cache } from "react";
import { uuidv7 } from "uuidv7";

import { db } from "@/db/drizzle";

import { 得意先Model, 得意先Output } from "../model/得意先Model";
import { 得意先 } from "../schema";

// --- 1. 内部実装用の実体 (外部からは見えない) ---
const _impl = {
  async search(
    キーワード: string,
    page: number = 1,
    pageSize: number,
  ): Promise<{ items: 得意先Output[]; totalCount: number }> {
    const pattern = `%${キーワード}%`;
    const offset = (page - 1) * pageSize;

    const whereClause = or(
      ilike(得意先.得意先名, pattern),
      ilike(得意先.電話番号, pattern),
    );

    const countResult = await db
      .select({ value: count() })
      .from(得意先)
      .where(whereClause);
    const totalCount = countResult[0].value;

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

  async searchById(得意先ID: string): Promise<得意先Output | null> {
    const results = await db
      .select()
      .from(得意先)
      .where(eq(得意先.得意先ID, 得意先ID))
      .limit(1);

    const target = results[0];
    return target ? 得意先Model.parse(target) : null;
  },

  async insert(データ: Omit<得意先Output, "得意先ID" | "version">) {
    return await db
      .insert(得意先)
      .values({
        ...データ,
        得意先ID: uuidv7(),
        version: 0,
      })
      .returning();
  },

  async update(
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

  async delete(得意先ID: string, 現在のversion: number) {
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

// --- 2. 外部公開用オブジェクト (メソッド名を維持) ---
export const 得意先Repository = {
  // 参照系は cache でラップして Request Memoization を有効化
  Search: cache(_impl.search),
  SearchById: cache(_impl.searchById),

  // 更新系は副作用を伴うため cache しない
  Insert: _impl.insert,
  Update: _impl.update,
  Delete: _impl.delete,
};
