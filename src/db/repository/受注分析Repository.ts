import "server-only";

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { AnalysisDuration, AnalysisInterval } from "@/lib/analysis-utils";

import { 受注, 受注明細 } from "../schema";

export const 受注分析Repository = {
  /**
   * 売上高推移の取得
   */
  async GetSalesTrend(duration: AnalysisDuration, interval: AnalysisInterval) {
    // 1. interval を sql.raw で埋め込む。
    // これにより、SQL上は $1 ではなく 'day' や 'month' というリテラルになる。
    const period = sql<string>`date_trunc(${sql.raw(`'${interval}'`)}, ${受注.受注日})`;

    return await db
      .select({
        period: period,
        totalAmount: sql<number>`sum(${受注.合計金額})`.mapWith(Number),
        count: sql<number>`count(${受注.受注ID})`.mapWith(Number),
      })
      .from(受注)
      .where(
        and(gte(受注.受注日, duration.from), lte(受注.受注日, duration.to)),
      )
      // 2. 同じ 'period' オブジェクト（中身は同一リテラルを含む式）を使うことで
      // Postgres に「同一の集計キーである」と完全に理解させる
      .groupBy(period)
      .orderBy(period);
  },

  /**
   * 得意先別売上ランキング
   */
  async GetTopCustomers(duration: AnalysisDuration, limit = 5) {
    // 1. 集計式を変数として定義
    const totalAmount = sql<number>`sum(${受注.合計金額})`.mapWith(Number);

    return await db
      .select({
        name: 受注.得意先名,
        value: totalAmount,
      })
      .from(受注)
      .where(
        and(gte(受注.受注日, duration.from), lte(受注.受注日, duration.to)),
      )
      .groupBy(受注.得意先名)
      .orderBy(desc(totalAmount))
      .limit(limit);
  },

  /**
   * 商品別売上ランキング
   */
  async GetTopProducts(duration: AnalysisDuration, limit = 5) {
    const totalAmount = sql<number>`sum(${受注明細.明細金額})`.mapWith(Number);

    return await db
      .select({
        name: 受注明細.商品名,
        value: totalAmount,
      })
      .from(受注明細)
      .innerJoin(受注, eq(受注明細.受注ID, 受注.受注ID))
      .where(
        and(gte(受注.受注日, duration.from), lte(受注.受注日, duration.to)),
      )
      .groupBy(受注明細.商品名)
      .orderBy(desc(totalAmount))
      .limit(limit);
  },
};
