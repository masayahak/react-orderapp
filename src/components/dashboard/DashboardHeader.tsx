"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Loader2, BarChart3, Clock } from "lucide-react";
import { AnalysisPreset, AnalysisInterval } from "@/lib/analysis-utils";

interface DashboardHeaderProps {
  activePreset: AnalysisPreset;
  from: string;
  to: string;
  activeInterval: AnalysisInterval;
}

/**
 * JST（日本時間）ベースで正確な日付範囲を計算する
 * 修正点: toISOString()の使用を廃止し、ローカル時刻(JST)の値を直接フォーマットする
 */
const getJstDateRange = (preset: AnalysisPreset) => {
  // 1. 現在時刻をJSTとして解釈したDateオブジェクトを生成
  const nowUtc = new Date();
  const jstString = nowUtc.toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
  const nowJst = new Date(jstString);

  // 2. 時刻を00:00:00にリセット（計算の基準点）
  nowJst.setHours(0, 0, 0, 0);

  // ヘルパー: Dateオブジェクトから YYYY-MM-DD 文字列を生成（ローカル値を使用）
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  let fromDate: Date;
  let toDate: Date;
  let interval: AnalysisInterval = "day";

  // 基準となる年・月・日
  const currentYear = nowJst.getFullYear();
  const currentMonth = nowJst.getMonth(); // 0-indexed
  const currentDate = nowJst.getDate();

  switch (preset) {
    case "week":
      // 終了日: 今日
      toDate = new Date(nowJst);
      // 開始日: 今日 - 6日
      fromDate = new Date(nowJst);
      fromDate.setDate(currentDate - 6);
      interval = "day";
      break;

    case "month":
      // 開始日: 今月1日
      fromDate = new Date(currentYear, currentMonth, 1);
      // 終了日: 今月の末日 (翌月の0日目)
      toDate = new Date(currentYear, currentMonth + 1, 0);
      interval = "day";
      break;

    case "quarter":
      // 直近の四半期開始月 (0, 3, 6, 9)
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;

      // 開始日: 四半期開始月の1日
      fromDate = new Date(currentYear, quarterStartMonth, 1);

      // 終了日: 四半期終了月の末日 (開始月+3ヶ月目の0日目)
      toDate = new Date(currentYear, quarterStartMonth + 3, 0);

      interval = "week";
      break;

    case "year":
      // 開始日: 今年1月1日
      fromDate = new Date(currentYear, 0, 1);
      // 終了日: 今年12月31日
      toDate = new Date(currentYear, 11, 31);
      interval = "month";
      break;

    default:
      fromDate = nowJst;
      toDate = nowJst;
  }

  return {
    from: formatDate(fromDate),
    to: formatDate(toDate),
    interval,
  };
};

export function DashboardHeader({
  activePreset,
  from,
  to,
  activeInterval,
}: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => params.set(key, value));
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handlePresetChange = (preset: string) => {
    const range = getJstDateRange(preset as AnalysisPreset);
    updateParams({
      preset,
      from: range.from,
      to: range.to,
      interval: range.interval,
    });
  };

  const handleDateChange = (type: "from" | "to", value: string) => {
    updateParams({ [type]: value });
  };

  const handleIntervalChange = (interval: string) => {
    updateParams({ interval });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-white px-6 py-4 rounded-xl border shadow-sm">
      {/* 左：タイトルエリア */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
            販売分析
          </h1>
          <p className="text-[10px] text-indigo-500 font-bold mt-1 uppercase tracking-widest">
            Sales Analytics
          </p>
        </div>
      </div>

      {/* 中央：メインコントロール（プリセットボタンを強調） */}
      <div className="flex justify-center">
        <Tabs
          value={activePreset}
          onValueChange={handlePresetChange}
          className="w-full max-w-[400px]"
        >
          <TabsList className="h-11 w-full bg-slate-100/80 p-1 grid grid-cols-4">
            <TabsTrigger
              value="week"
              className="text-xs font-bold data-[state=active]:shadow-md"
            >
              週間
            </TabsTrigger>
            <TabsTrigger
              value="month"
              className="text-xs font-bold data-[state=active]:shadow-md"
            >
              月間
            </TabsTrigger>
            <TabsTrigger
              value="quarter"
              className="text-xs font-bold data-[state=active]:shadow-md"
            >
              四半期
            </TabsTrigger>
            <TabsTrigger
              value="year"
              className="text-xs font-bold data-[state=active]:shadow-md"
            >
              年間
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 右：サブコントロール（日付・単位） */}
      <div className="flex items-center gap-3 ml-auto">
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        )}

        {/* 期間指定ツール */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <Input
            type="date"
            value={from}
            onChange={(e) => handleDateChange("from", e.target.value)}
            className="h-7 w-[120px] border-none bg-transparent text-[11px] font-medium p-0 focus-visible:ring-0"
          />
          <span className="text-slate-400 text-xs">~</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => handleDateChange("to", e.target.value)}
            className="h-7 w-[120px] border-none bg-transparent text-[11px] font-medium p-0 focus-visible:ring-0"
          />
        </div>

        {/* 集計単位 */}
        <Select value={activeInterval} onValueChange={handleIntervalChange}>
          <SelectTrigger className="h-10 w-[110px] text-xs font-semibold bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="day" className="text-xs">
              日単位
            </SelectItem>
            <SelectItem value="week" className="text-xs">
              週単位
            </SelectItem>
            <SelectItem value="month" className="text-xs">
              月単位
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
