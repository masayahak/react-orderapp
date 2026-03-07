// =============================================
// 分析条件用の型定義
// =============================================
export type AnalysisPreset = "week" | "month" | "year";
export type AnalysisInterval = "day" | "month";
export type AnalysisDirection = "current" | "prev" | "next";

export type AnalysisDuration = {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
};

// 分析用の検索条件全体（Single Source of Truth）
export type AnalysisParams = {
  preset: AnalysisPreset;
  duration: AnalysisDuration;
  interval: AnalysisInterval;
  direction: AnalysisDirection;
};

// プリセットから集計単位を一義的に決定する（関数従属の定義）
export const getIntervalByPreset = (
  preset: AnalysisPreset,
): AnalysisInterval => {
  return preset === "year" ? "month" : "day";
};

// =============================================
// 書式変換ヘルパー
// =============================================

// Dateオブジェクトを yyyy-MM-dd 形式の文字列に変換
export const dateFormatJPLocal = (d: Date): string => {
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 数値を 3桁区切り（#,##0）にフォーマット
export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("ja-JP").format(value);

// 通貨（日本円）フォーマット。大きな数値は 万円/億円 単位に丸める
export const formatCurrency = (val: number): string => {
  if (val >= 100000000) {
    return `${formatNumber(val / 100000000)}億円`;
  }
  if (val >= 10000) {
    return `${formatNumber(val / 10000)}万円`;
  }
  return `${formatNumber(val)}円`;
};

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
      from: dateFormatJPLocal(from),
      to: dateFormatJPLocal(to),
    } as AnalysisDuration,
    interval: getIntervalByPreset(preset),
  };
};

// 指定された期間内に「受注0」で埋められた初期データ配列を生成
export const generateEmptyTrendData = (
  duration: AnalysisDuration,
  interval: AnalysisInterval,
) => {
  const start = new Date(duration.from.replace(/-/g, "/"));
  const end = new Date(duration.to.replace(/-/g, "/"));
  const result: { period: string; totalAmount: number; count: number }[] = [];

  const current = new Date(start);

  while (current <= end) {
    const periodStr = dateFormatJPLocal(current);
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
          from: dateFormatJPLocal(dFrom),
          to: dateFormatJPLocal(dToW),
        };
        break;
      case "month":
        const nextM = new Date(dFrom.getFullYear(), dFrom.getMonth() + step, 1);
        const nextE = new Date(nextM.getFullYear(), nextM.getMonth() + 1, 0);
        newDuration = {
          from: dateFormatJPLocal(nextM),
          to: dateFormatJPLocal(nextE),
        };
        break;
      case "year":
        const nextY = new Date(dFrom.getFullYear() + step, 0, 1);
        const nextYE = new Date(nextY.getFullYear(), 11, 31);
        newDuration = {
          from: dateFormatJPLocal(nextY),
          to: dateFormatJPLocal(nextYE),
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
