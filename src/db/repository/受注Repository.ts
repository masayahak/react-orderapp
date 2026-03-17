import "server-only";

import { and, count, desc, eq, exists, gte, ilike, lte, or } from "drizzle-orm";
import { cache } from "react";
import { uuidv7 } from "uuidv7";

import { db } from "@/db/drizzle";

import {
  受注HeaderModel,
  受注HeaderOutput,
  受注Model,
  受注Output,
} from "../model/受注Model";
import { 受注, 受注明細 } from "../schema";

// --- 1. 内部実装用の実体 (外部からは直接見えない) ---
const _impl = {
  async search(params: {
    startDate?: string;
    endDate?: string;
    keyword?: string;
    page?: number;
    pageSize: number;
  }): Promise<{ items: 受注HeaderOutput[]; totalCount: number }> {
    const { startDate, endDate, keyword, page = 1, pageSize } = params;
    const offset = (page - 1) * pageSize;

    const filters = [];
    if (startDate) filters.push(gte(受注.受注日, startDate));
    if (endDate) filters.push(lte(受注.受注日, endDate));

    if (keyword) {
      const pattern = `%${keyword}%`;
      filters.push(
        or(
          ilike(受注.得意先名, pattern),
          exists(
            db
              .select()
              .from(受注明細)
              .where(
                and(
                  eq(受注明細.受注ID, 受注.受注ID),
                  or(
                    ilike(受注明細.商品CD, pattern),
                    ilike(受注明細.商品名, pattern),
                  ),
                ),
              ),
          ),
        ),
      );
    }

    const whereClause = and(...filters);

    const countResult = await db
      .select({ value: count() })
      .from(受注)
      .where(whereClause);
    const totalCount = countResult[0].value;

    const items = await db
      .select()
      .from(受注)
      .where(whereClause)
      .orderBy(desc(受注.受注日), desc(受注.受注ID))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map((i) => 受注HeaderModel.parse(i)),
      totalCount,
    };
  },

  async findById(受注ID: string): Promise<受注Output | null> {
    const headerResults = await db
      .select()
      .from(受注)
      .where(eq(受注.受注ID, 受注ID))
      .limit(1);

    const targetHeader = headerResults[0];
    if (!targetHeader) return null;

    const details = await db
      .select()
      .from(受注明細)
      .where(eq(受注明細.受注ID, 受注ID));

    return 受注Model.parse({
      ...targetHeader,
      明細: details,
    });
  },

  async save(data: 受注Output, mode: "create" | "edit", orderId?: string) {
    const targetId = mode === "edit" ? orderId! : uuidv7();

    const headerValues = {
      受注日: data.受注日,
      得意先ID: data.得意先ID,
      得意先名: data.得意先名,
      合計金額: data.合計金額.toString(),
    };

    const detailValues = data.明細.map((m) => ({
      受注ID: targetId,
      商品CD: m.商品CD,
      商品名: m.商品名,
      単価: m.単価.toString(),
      数量: m.数量.toString(),
      明細金額: m.明細金額.toString(),
    }));

    if (mode === "edit") {
      await db.transaction(async (tx) => {
        const updateResult = await tx
          .update(受注)
          .set({ ...headerValues, version: data.version + 1 })
          .where(
            and(eq(受注.受注ID, targetId), eq(受注.version, data.version)),
          );

        if (updateResult.rowCount === 0) {
          throw new Error(
            "対象のデータは別のユーザーによって更新されたか、削除されています。",
          );
        }
        await tx.delete(受注明細).where(eq(受注明細.受注ID, targetId));
        await tx.insert(受注明細).values(detailValues);
      });
    } else {
      await db.transaction(async (tx) => {
        await tx.insert(受注).values({ ...headerValues, 受注ID: targetId });
        await tx.insert(受注明細).values(detailValues);
      });
    }
  },

  async delete(受注ID: string, version: number) {
    const result = await db
      .delete(受注)
      .where(and(eq(受注.受注ID, 受注ID), eq(受注.version, version)));

    if (result.rowCount === 0) {
      throw new Error(
        "対象のデータは既に別のユーザーによって更新または削除されています。",
      );
    }

    return result;
  },
};

// --- 2. 外部公開用オブジェクト (メソッド名を維持) ---
export const 受注Repository = {
  // 参照系: React.cache でメモ化
  Search: cache(_impl.search),
  GetById: cache(_impl.findById),

  // 更新・削除系: 副作用を伴うため cache しない
  Save: _impl.save,
  Delete: _impl.delete,
};
