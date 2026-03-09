import "server-only";

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/drizzle";
import { AnalysisDuration, AnalysisInterval } from "@/lib/analysis-utils";

import { 受注, 受注明細 } from "../schema";

// --- 1. 内部実装用の実体 (外部からは直接見えない) ---
const _impl = {
  /**
   * 売上高推移の取得
   */
  async getSalesTrend(duration: AnalysisDuration, interval: AnalysisInterval) {
    const period =
      interval === "month"
        ? sql<string>`date_trunc('month', ${受注.受注日})`
        : sql<string>`date_trunc('day', ${受注.受注日})`;

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
      .groupBy(period)
      .orderBy(period);
  },

  /**
   * 得意先別売上ランキング
   */
  async getTopCustomers(duration: AnalysisDuration, limit = 5) {
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
  async getTopProducts(duration: AnalysisDuration, limit = 5) {
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

// --- 2. 外部公開用オブジェクト (メソッド名を維持し、すべて参照系のため cache を適用) ---
export const 受注分析Repository = {
  /**
   * 売上高推移の取得 (同一リクエスト内メモ化対象)
   */
  GetSalesTrend: cache(_impl.getSalesTrend),

  /**
   * 得意先別売上ランキング (同一リクエスト内メモ化対象)
   */
  GetTopCustomers: cache(_impl.getTopCustomers),

  /**
   * 商品別売上ランキング (同一リクエスト内メモ化対象)
   */
  GetTopProducts: cache(_impl.getTopProducts),
};
