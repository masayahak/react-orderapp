export type AnalysisPreset = "week" | "month" | "year";
export type AnalysisDuration = {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
};
export type AnalysisInterval = "day" | "month";

// 日付文字列「yyyy-MM-dd」を作成するヘルパー
export const dateFormatJPLocal = (d: Date) => {
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getAnalysisDefaults = (preset: AnalysisPreset) => {
  const getJSTDate = () => {
    const now = new Date();
    const jstString = now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
    return new Date(jstString);
  };
  const today = getJSTDate();

  let from = new Date(today);
  let to = new Date(today);
  let interval: AnalysisInterval = "day";

  switch (preset) {
    case "week":
      from.setDate(today.getDate() - 6);
      interval = "day";
      break;
    case "month":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      to = monthEnd;
      interval = "day";
      break;
    case "year":
      from = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31);
      to = yearEnd;
      interval = "month";
      break;
  }

  return {
    duration: {
      from: dateFormatJPLocal(from),
      to: dateFormatJPLocal(to),
    } as AnalysisDuration,
    interval,
  };
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

export const formatCurrency = (val: number) => {
  if (val >= 100000000) {
    return `${formatNumber(val / 100000000)}億円`;
  }
  if (val >= 10000) {
    return `${formatNumber(val / 10000)}万円`;
  }
  return `${formatNumber(val)}円`;
};

// 指定された期間内の売上0の初期データ配列を生成する
export const generateEmptyTrendData = (
  duration: AnalysisDuration,
  interval: AnalysisInterval,
) => {
  const start = new Date(duration.from);
  const end = new Date(duration.to);
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
    } else if (interval === "month") {
      current.setMonth(current.getMonth() + 1);
      current.setDate(1); // 常に月初にリセット
    }
  }

  return result;
};
