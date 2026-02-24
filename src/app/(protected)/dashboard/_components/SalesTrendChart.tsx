"use client";

import * as React from "react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AnalysisInterval } from "@/lib/analysis-utils";

interface SalesTrendChartProps {
  data: {
    period: string;
    totalAmount: number;
    count: number;
  }[];
  interval: AnalysisInterval;
}

export function SalesTrendChart({ data, interval }: SalesTrendChartProps) {
  const [activeChart, setActiveChart] = React.useState<"totalAmount" | "count">(
    "totalAmount",
  );

  // チャート設定（色定義）
  const chartConfig = {
    totalAmount: {
      label: "売上金額",
      color: "#4A6984", // Indigo-600
    },
    count: {
      label: "受注件数",
      color: "#64748b", // Slate-500
    },
  } satisfies ChartConfig;

  // データ加工（日付フォーマット）
  const chartData = useMemo(() => {
    return data.map((item) => {
      const date = new Date(item.period);
      let label = "";
      switch (interval) {
        case "day":
          label = `${date.getMonth() + 1}/${date.getDate()}`;
          break;
        case "week":
          label = `${date.getMonth() + 1}/${date.getDate()}~`;
          break;
        case "month":
          label = `${date.getFullYear()}/${date.getMonth() + 1}`;
          break;
      }
      return { ...item, displayPeriod: label };
    });
  }, [data, interval]);

  // 合計値計算
  const totals = useMemo(
    () => ({
      totalAmount: data.reduce((acc, curr) => acc + curr.totalAmount, 0),
      count: data.reduce((acc, curr) => acc + curr.count, 0),
    }),
    [data],
  );

  // Y軸の単位フォーマッタ（億・万対応）
  const formatYAxis = (value: number) => {
    if (activeChart === "count") return value.toLocaleString();
    if (value >= 100000000) return `¥${(value / 100000000).toFixed(1)}億`;
    if (value >= 10000) return `¥${(value / 10000).toFixed(0)}万`;
    return `¥${value}`;
  };

  // 通貨表示フォーマッタ
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);

  // 数値表示フォーマッタ
  const formatNumber = (value: number) =>
    new Intl.NumberFormat("ja-JP").format(value);

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent overflow-hidden">
      {/* ヘッダーエリア：タブ切り替え */}
      <CardHeader className="flex flex-row items-center space-y-0 border-b p-0 shrink-0">
        {/* 売上金額タブ */}
        <div
          data-active={activeChart === "totalAmount"}
          className="flex flex-1 flex-col justify-center gap-0.5 px-4 py-3 transition-colors cursor-pointer border-r data-[active=true]:bg-white data-[active=false]:bg-slate-50 hover:bg-slate-100 first:rounded-tl-xl"
          onClick={() => setActiveChart("totalAmount")}
        >
          <span className="text-[10px] text-muted-foreground font-medium">
            売上金額 (合計)
          </span>
          <span className="text-xl font-black text-indigo-600 sm:text-2xl leading-none">
            {formatCurrency(totals.totalAmount)}
          </span>
        </div>

        {/* 受注件数タブ */}
        <div
          data-active={activeChart === "count"}
          className="flex flex-1 flex-col justify-center gap-0.5 px-4 py-3 transition-colors cursor-pointer data-[active=true]:bg-white data-[active=false]:bg-slate-50 hover:bg-slate-100 last:rounded-tr-xl"
          onClick={() => setActiveChart("count")}
        >
          <span className="text-[10px] text-muted-foreground font-medium">
            受注件数 (合計)
          </span>
          <span className="text-xl font-black text-slate-700 sm:text-2xl leading-none">
            {formatNumber(totals.count)}
            <span className="text-xs ml-1 text-muted-foreground font-normal">
              件
            </span>
          </span>
        </div>
      </CardHeader>

      {/* コンテンツエリア：チャート本体 */}
      <CardContent className="flex-1 min-h-0 px-2 pt-4 pb-0">
        <div className="w-full h-full">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }} // 左マージンを詰めてスペース確保
              barCategoryGap="15%" // バーの間隔を詰めて太く見せる
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="displayPeriod"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 16, fill: "#64748b" }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 16, fill: "#64748b" }}
                tickFormatter={formatYAxis}
                width={120} // 軸の幅を最小限に
              />

              <ChartTooltip
                cursor={{ fill: "#f1f5f9" }}
                content={
                  <ChartTooltipContent
                    className="w-[140px] bg-white border-slate-200"
                    nameKey={activeChart}
                    labelKey="displayPeriod"
                  />
                }
              />

              <Bar
                dataKey={activeChart}
                fill={chartConfig[activeChart].color}
                radius={[4, 4, 0, 0]}
                maxBarSize={120} // 太さの上限を緩和
                onClick={(data) => {
                  if (!data || !data.period) return;

                  // 選択されたバーの受注日（または期間）の受注一覧へ遷移する
                  const formatDate = (d: Date) => {
                    if (isNaN(d.getTime())) return "";
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                  };

                  const baseDate = new Date(data.period);

                  // 開始日・終了日ともに、必ず yyyy-MM-dd 形式に変換する
                  const fromStr = formatDate(baseDate);
                  let toStr = fromStr;

                  if (interval === "month") {
                    const endOfMonth = new Date(
                      baseDate.getFullYear(),
                      baseDate.getMonth() + 1,
                      0,
                    );
                    toStr = formatDate(endOfMonth);
                  } else if (interval === "week") {
                    const endOfWeek = new Date(baseDate.getTime());
                    endOfWeek.setDate(baseDate.getDate() + 6);
                    toStr = formatDate(endOfWeek);
                  }

                  window.location.href = `/order?startDate=${fromStr}&endDate=${toStr}`;
                }}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
