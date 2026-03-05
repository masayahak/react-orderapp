"use client";

import { BarChart3, CalendarIcon, Clock, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AnalysisInterval,
  AnalysisPreset,
  getAnalysisDefaults,
} from "@/lib/analysis-utils";

interface DashboardHeaderProps {
  activePreset: AnalysisPreset;
  from: string;
  to: string;
  activeInterval: AnalysisInterval;
}

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
    // ユーティリティから初期値を取得 (四半期ロジックは削除済み)
    const defaults = getAnalysisDefaults(preset as AnalysisPreset);
    updateParams({
      preset,
      from: defaults.duration.from,
      to: defaults.duration.to,
      interval: defaults.interval,
    });
  };

  const handleDateChange = (type: "from" | "to", value: string) => {
    updateParams({ [type]: value });
  };

  const handleIntervalChange = (interval: string) => {
    updateParams({ interval });
  };

  return (
    <div className="flex flex-wrap md:flex-nowrap items-center gap-4 bg-white px-6 py-4 rounded-xl border shadow-md min-h-[80px]">
      {/* 1. 左エリア：ブランド表示（シンプルに） */}
      <div className="flex items-center gap-3 shrink-0 mr-4">
        <div className="p-2 bg-slate-900 rounded-lg shadow-inner">
          <BarChart3 className="h-5 w-5 text-indigo-100" />
        </div>
        <div className="hidden lg:block">
          <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">
            Analysis
          </h1>
        </div>
      </div>

      {/* 2. 中央エリア：操作のメインハブ */}
      <div className="flex-1 flex items-center justify-center gap-6">
        <Tabs
          value={activePreset}
          onValueChange={handlePresetChange}
          className="shrink-0 shadow-lg shadow-indigo-100 rounded-lg p-1 bg-slate-100"
        >
          <TabsList className="h-10 w-[240px] bg-transparent">
            <TabsTrigger
              value="week"
              className="flex-1 text-sm font-black data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
            >
              直近7日間
            </TabsTrigger>
            <TabsTrigger
              value="month"
              className="flex-1 text-sm font-black data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
            >
              月間
            </TabsTrigger>
            <TabsTrigger
              value="year"
              className="flex-1 text-sm font-black data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
            >
              年間
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 垂直セパレーター */}
        <div className="h-8 w-px bg-slate-200 hidden md:block" />

        {/* 期間と単位をセットで配置 */}
        <div className="flex items-center gap-3">
          <div className="flex mr-6 items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={from}
                onChange={(e) => handleDateChange("from", e.target.value)}
                className="h-5 w-[115px] border-none bg-transparent text-xs font-bold p-0 focus-visible:ring-0 cursor-pointer"
              />
              <span className="text-slate-300 font-light">→</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => handleDateChange("to", e.target.value)}
                className="h-5 w-[115px] border-none bg-transparent text-xs font-bold p-0 focus-visible:ring-0 cursor-pointer"
              />
            </div>
          </div>

          <Select value={activeInterval} onValueChange={handleIntervalChange}>
            <SelectTrigger className="h-10 w-[110px] text-xs font-bold bg-slate-50 border-slate-200 hover:bg-white transition-colors">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="day" className="font-medium">
                日単位
              </SelectItem>
              <SelectItem value="month" className="font-medium">
                月単位
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. 右エリア：状態表示 */}
      <div className="flex items-center justify-end w-[60px] shrink-0">
        {isPending ? (
          <div className="flex items-center gap-2 text-indigo-600">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        )}
      </div>
    </div>
  );
}
