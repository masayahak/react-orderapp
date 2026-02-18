export type AnalysisInterval = "day" | "week" | "month";

export type AnalysisDuration = {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
};

export type AnalysisPreset = "week" | "month" | "quarter" | "year";

export const getAnalysisDefaults = (preset: AnalysisPreset) => {
  const today = new Date();

  // ローカル日付(JST)文字列を作成するヘルパー
  const formatLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  let to = formatLocal(today);
  let from = new Date(today);
  let interval: AnalysisInterval = "day";

  switch (preset) {
    case "week":
      from.setDate(today.getDate() - 6);
      interval = "day";
      break;
    case "month":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      // 月末まで
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      to = formatLocal(monthEnd);
      interval = "day";
      break;
    case "quarter":
      const qMonth = Math.floor(today.getMonth() / 3) * 3;
      from = new Date(today.getFullYear(), qMonth, 1);
      const qEnd = new Date(today.getFullYear(), qMonth + 3, 0);
      to = formatLocal(qEnd);
      interval = "week";
      break;
    case "year":
      from = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31);
      to = formatLocal(yearEnd);
      interval = "month";
      break;
  }

  return {
    duration: {
      from: formatLocal(from),
      to,
    } as AnalysisDuration,
    interval,
  };
};
