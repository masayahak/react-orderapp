"use client";

import { ArrowLeft, ArrowRight, BarChart3, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AnalysisDirection,
  AnalysisParams,
  AnalysisPreset,
  calculateAnalysisParams,
} from "@/lib/analysis-utils";

interface DashboardHeaderProps {
  params: AnalysisParams;
}

export function DashboardHeader({ params }: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URLパラメータの更新：interval は preset から導出されるため、URLからは除外
  const navigate = (next: AnalysisParams) => {
    const urlParams = new URLSearchParams(searchParams.toString());
    urlParams.set("preset", next.preset);
    urlParams.set("from", next.duration.from);
    urlParams.set("to", next.duration.to);

    // interval の set を削除
    urlParams.delete("interval");

    startTransition(() => {
      router.push(`?${urlParams.toString()}`);
    });
  };

  const handlePresetChange = (preset: string) => {
    const next = calculateAnalysisParams(params, {
      preset: preset as AnalysisPreset,
      direction: "current",
    });
    navigate(next);
  };

  const handleShift = (direction: AnalysisDirection) => {
    const next = calculateAnalysisParams(params, { direction });
    navigate(next);
  };

  const displayFrom = params.duration.from.replace(/-/g, "/");
  const displayTo = params.duration.to.replace(/-/g, "/");

  return (
    <div className="flex flex-wrap md:flex-nowrap items-center gap-4 bg-white px-6 py-4 rounded-xl border shadow-md min-h-[80px]">
      {/* 1. 左エリア：ブランド */}
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

      {/* 2. 中央エリア：操作ハブ */}
      <div className="flex-1 flex items-center justify-center gap-8">
        <Tabs
          value={params.preset}
          onValueChange={handlePresetChange}
          className="shrink-0 shadow-lg shadow-indigo-100 rounded-lg p-1 bg-slate-100"
        >
          <TabsList className="h-10 w-[240px] bg-transparent">
            <TabsTrigger
              value="week"
              className="flex-1 text-sm font-black data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
            >
              週間
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

        <div className="h-8 w-px bg-slate-200 hidden md:block" />

        {/* 期間ナビゲーター */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShift("prev")}
            disabled={isPending}
            className="size-7 rounded-[min(var(--radius-md),12px)] border-border bg-background hover:bg-muted hover:text-foreground shadow-sm transition-all"
            aria-label="Go Back"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="flex items-center justify-center bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm min-w-[210px] select-none">
            <span className="text-[13px] font-bold text-slate-700 tracking-tight font-mono">
              {displayFrom}
            </span>
            <span className="mx-2 text-slate-300">→</span>
            <span className="text-[13px] font-bold text-slate-700 tracking-tight font-mono">
              {displayTo}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShift("next")}
            disabled={isPending}
            className="size-7 rounded-[min(var(--radius-md),12px)] border-border bg-background hover:bg-muted hover:text-foreground shadow-sm transition-all"
            aria-label="Go Forward"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* 3. 右エリア：状態表示 */}
      <div className="flex items-center justify-end w-[40px] shrink-0">
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        )}
      </div>
    </div>
  );
}
