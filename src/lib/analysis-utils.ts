import { z } from "zod";

import { dateStringSchema } from "@/db/model/dateStringSchema";
import { formatDateJpLocal } from "@/lib/formatters";

// 基本的な型定義
export type AnalysisPreset = "week" | "month" | "year";
export type AnalysisInterval = "day" | "month";
export type AnalysisDirection = "current" | "prev" | "next";

export type AnalysisDuration = {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
};

// プリセットから集計単位を一義的に決定する（関数従属の定義）
const getIntervalByPreset = (preset: AnalysisPreset): AnalysisInterval => {
  return preset === "year" ? "month" : "day";
};

// =============================================
// Zod スキーマ定義
// =============================================
export const analysisParamsSchema = z
  .object({
    preset: z.enum(["week", "month", "year"]).catch("month"),
    from: dateStringSchema,
    to: dateStringSchema,
    direction: z.enum(["current", "prev", "next"]).default("current"),
  })
  .transform((data) => {
    return {
      preset: data.preset,
      direction: data.direction,
      interval: getIntervalByPreset(data.preset),
      duration: {
        from: data.from,
        to: data.to,
      },
    };
  });

// 最終的な AnalysisParams 型
export type AnalysisParams = z.infer<typeof analysisParamsSchema>;

// =============================================
// 分析用初期条件取得
// =============================================

// プリセットに基づいたデフォルトの期間と集計単位を取得
export const getAnalysisDefaults = (preset: AnalysisPreset) => {
  const getJSTDate = () => {
    const now = new Date();
    // 実行環境によらず日本時間基準で計算
    const jstString = now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
    return new Date(jstString);
  };

  const today = getJSTDate();
  let from = new Date(today);
  let to = new Date(today);

  switch (preset) {
    case "week":
      from.setDate(today.getDate() - 6);
      break;
    case "month":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case "year":
      from = new Date(today.getFullYear(), 0, 1);
      to = new Date(today.getFullYear(), 11, 31);
      break;
  }

  return {
    duration: {
      from: formatDateJpLocal(from),
      to: formatDateJpLocal(to),
    } as AnalysisDuration,
    interval: getIntervalByPreset(preset),
  };
};

// 指定された期間内に「受注0」で埋められた初期データ配列を生成
export const generateEmptyTrendData = (
  duration: AnalysisDuration,
  interval: AnalysisInterval,
) => {
  // new Date("2024-01-15") はISO 8601形式のためUTC 00:00として解釈される。
  // "-" を "/" に置換することでローカルタイム基準のパースになり、日付のズレを防ぐ。
  const start = new Date(duration.from.replace(/-/g, "/"));
  const end = new Date(duration.to.replace(/-/g, "/"));
  const result: { period: string; totalAmount: number; count: number }[] = [];

  const current = new Date(start);

  while (current <= end) {
    const periodStr = formatDateJpLocal(current);
    result.push({
      period: periodStr,
      totalAmount: 0,
      count: 0,
    });

    if (interval === "day") {
      current.setDate(current.getDate() + 1);
    } else {
      // month
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }
  }
  return result;
};

// =============================================
// 分析期間の変更ロジック
// =============================================

// 現在の状態と更新指示を受け取り、新しい AnalysisParams を算出する
export const calculateAnalysisParams = (
  current: AnalysisParams,
  update: {
    preset?: AnalysisPreset;
    direction?: AnalysisDirection;
  },
): AnalysisParams => {
  // スプレッド構文で最新の意図（preset, direction）をマージ
  const { preset, direction } = { ...current, ...update };

  let newDuration = { ...current.duration };
  const newInterval = getIntervalByPreset(preset);

  // 1. 期間移動（Prev / Next）の処理
  if (direction !== "current") {
    const dFrom = new Date(newDuration.from.replace(/-/g, "/"));
    const step = direction === "next" ? 1 : -1;

    switch (preset) {
      case "week":
        dFrom.setDate(dFrom.getDate() + step * 7);
        const dToW = new Date(dFrom);
        dToW.setDate(dFrom.getDate() + 6);
        newDuration = {
          from: formatDateJpLocal(dFrom),
          to: formatDateJpLocal(dToW),
        };
        break;
      case "month":
        const nextM = new Date(dFrom.getFullYear(), dFrom.getMonth() + step, 1);
        const nextE = new Date(nextM.getFullYear(), nextM.getMonth() + 1, 0);
        newDuration = {
          from: formatDateJpLocal(nextM),
          to: formatDateJpLocal(nextE),
        };
        break;
      case "year":
        const nextY = new Date(dFrom.getFullYear() + step, 0, 1);
        const nextYE = new Date(nextY.getFullYear(), 11, 31);
        newDuration = {
          from: formatDateJpLocal(nextY),
          to: formatDateJpLocal(nextYE),
        };
        break;
    }
  }
  // 2. プリセット変更（タブ切り替え）の処理
  else if (update.preset) {
    const defaults = getAnalysisDefaults(update.preset);
    newDuration = defaults.duration;
  }

  return {
    preset,
    duration: newDuration,
    interval: newInterval,
    direction: "current",
  };
};
