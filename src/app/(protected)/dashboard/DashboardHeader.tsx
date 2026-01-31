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
import {
  AnalysisPreset,
  AnalysisInterval,
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
    const { duration, interval } = getAnalysisDefaults(
      preset as AnalysisPreset,
    );
    updateParams({
      preset,
      from: duration.from,
      to: duration.to,
      interval: interval,
    });
  };

  const handleDateChange = (type: "from" | "to", value: string) => {
    updateParams({ [type]: value });
  };

  const handleIntervalChange = (interval: string) => {
    updateParams({ interval });
  };

  return (
    <div className="flex flex-row items-center justify-between gap-4 bg-white px-5 py-3 rounded-xl border shadow-sm">
      {/* 左側：タイトルエリア */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
            販売分析
          </h1>
          <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">
            Dashboard
          </p>
        </div>
      </div>

      {/* 右側：コントロールエリア */}
      <div className="flex items-center gap-4 ml-auto">
        {isPending && (
          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
        )}

        {/* 1. プリセットTabs */}
        <Tabs value={activePreset} onValueChange={handlePresetChange}>
          <TabsList className="h-8 bg-slate-100/50 p-0.5">
            <TabsTrigger value="week" className="text-[11px] h-7 px-3">
              週間
            </TabsTrigger>
            <TabsTrigger value="month" className="text-[11px] h-7 px-3">
              月間
            </TabsTrigger>
            <TabsTrigger value="quarter" className="text-[11px] h-7 px-3">
              四半期
            </TabsTrigger>
            <TabsTrigger value="year" className="text-[11px] h-7 px-3">
              年間
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* 2. 期間指定ツール */}
        <div className="flex items-center gap-2 bg-slate-50/50 px-2 py-1 rounded-md border border-slate-100">
          <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
          <Input
            type="date"
            value={from}
            onChange={(e) => handleDateChange("from", e.target.value)}
            className="h-7 w-[125px] border-none bg-transparent text-[11px] p-0 focus-visible:ring-0"
          />
          <span className="text-slate-300 text-xs">~</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => handleDateChange("to", e.target.value)}
            className="h-7 w-[125px] border-none bg-transparent text-[11px] p-0 focus-visible:ring-0"
          />
        </div>

        {/* 3. 集計単位Select */}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <Select value={activeInterval} onValueChange={handleIntervalChange}>
            <SelectTrigger className="h-8 w-24 text-[11px] bg-slate-50/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
    </div>
  );
}
