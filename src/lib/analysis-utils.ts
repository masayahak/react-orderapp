export type AnalysisInterval = "day" | "week" | "month";

export type AnalysisDuration = {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
};

export type AnalysisPreset = "week" | "month" | "quarter" | "year";

export const getAnalysisDefaults = (preset: AnalysisPreset) => {
  const today = new Date();
  const to = today.toISOString().split("T")[0];
  let from = new Date(today);
  let interval: AnalysisInterval = "day";

  switch (preset) {
    case "week":
      from.setDate(today.getDate() - 6);
      interval = "day";
      break;
    case "month":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      interval = "day";
      break;
    case "quarter":
      // 直近の期首 (1, 4, 7, 10月) を計算
      const qMonth = Math.floor(today.getMonth() / 3) * 3;
      from = new Date(today.getFullYear(), qMonth, 1);
      interval = "week";
      break;
    case "year":
      from = new Date(today.getFullYear(), 0, 1);
      interval = "month";
      break;
  }

  return {
    duration: {
      from: from.toISOString().split("T")[0],
      to,
    } as AnalysisDuration,
    interval,
  };
};
