import "server-only";
import { db } from "@/db/drizzle";
import { and, eq, ilike, or, desc, count, gte, lte, exists } from "drizzle-orm";
import { 受注, 受注明細 } from "../schema";
import { uuidv7 } from "uuidv7";
import {
  受注HeaderModel,
  受注HeaderOutput,
  受注Input,
  受注Model,
  受注Output,
} from "../model/受注Model";

export const 受注Repository = {
  /**
   * 受注一覧の検索（期間指定 + 得意先/商品名あいまい）
   */
  async Search(params: {
    startDate?: string;
    endDate?: string;
    keyword?: string;
    page?: number;
    pageSize: number;
  }): Promise<{ items: 受注HeaderOutput[]; totalCount: number }> {
    const { startDate, endDate, keyword, page = 1, pageSize } = params;
    const offset = (page - 1) * pageSize;

    // 検索条件の構築
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
      items: items.map((i) => 受注HeaderModel.parse({ ...i, 明細: [] })),
      totalCount,
    };
  },

  async GetById(受注ID: string): Promise<受注Output | null> {
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

  async Save(data: 受注Input, mode: "create" | "edit", orderId?: string) {
    const targetId = mode === "edit" ? orderId! : uuidv7();

    // 1. ヘッダーの値を DB 型（string）に適合させる
    const headerValues = {
      受注日: data.受注日,
      得意先ID: data.得意先ID,
      得意先名: data.得意先名,
      合計金額: data.合計金額.toString(), // numeric型への対応
    };

    // 2. 明細の各行を DB 型に適合させる
    const detailValues = data.明細.map((m) => ({
      受注ID: targetId,
      商品CD: m.商品CD,
      商品名: m.商品名,
      単価: m.単価.toString(), // numeric型
      数量: m.数量.toString(), // ★ここも numeric型なら string が必要
      明細金額: m.明細金額.toString(), // numeric型
    }));

    if (mode === "edit") {
      // batch実行：Update -> Delete -> Insert
      return await db.batch([
        db.update(受注).set(headerValues).where(eq(受注.受注ID, targetId)),
        db.delete(受注明細).where(eq(受注明細.受注ID, targetId)),
        db.insert(受注明細).values(detailValues),
      ]);
    } else {
      // batch実行：Insert -> Insert
      return await db.batch([
        db.insert(受注).values({ ...headerValues, 受注ID: targetId }),
        db.insert(受注明細).values(detailValues),
      ]);
    }
  },

  async Delete(orderId: string) {
    return await db.batch([
      db.delete(受注明細).where(eq(受注明細.受注ID, orderId)),
      db.delete(受注).where(eq(受注.受注ID, orderId)),
    ]);
  },
};
