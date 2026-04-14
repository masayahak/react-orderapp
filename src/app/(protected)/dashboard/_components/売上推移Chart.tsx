"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AnalysisParams, generateEmptyTrendData } from "@/lib/analysis-utils";
import {
  formatDateJpLocal,
  formatNumber,
  format円,
  format円Large,
} from "@/lib/formatters";

interface SalesTrendChartProps {
  data: { period: string; totalAmount: number; count: number }[];
  params: AnalysisParams; // 構造体で一括受け取り
}

type ChartType = "totalAmount" | "count";

interface CustomTickProps {
  x: number;
  y: number;
  payload: { value: string };
}

/**
 * X軸のカスタムラベル：土日の色分けをインラインスタイルで強制適用
 */
const CustomXAxisTick = ({ x, y, payload }: CustomTickProps) => {
  const label = payload.value;
  let color = "#64748b";
  let fontWeight = "normal";

  // 文字列に「日」または「土」が含まれるかで判定
  if (label.includes("日")) {
    color = "#ef4444";
    fontWeight = "bold";
  } else if (label.includes("土")) {
    color = "#3b82f6";
    fontWeight = "bold";
  }

  return (
    <text
      x={x}
      y={y + 16}
      fontSize={12}
      textAnchor="middle"
      className="select-none"
      style={{ fill: color, fontWeight }}
    >
      {label}
    </text>
  );
};

const chartConfig = {
  totalAmount: { label: "売上金額", color: "#4A6984" },
  count: { label: "受注件数", color: "#64748b" },
} satisfies ChartConfig;

export function SalesTrendChart({ data, params }: SalesTrendChartProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeChart, setActiveChart] = useState<ChartType>("totalAmount");

  const { duration, interval, preset } = params;

  const chartData = useMemo(() => {
    const emptyData = generateEmptyTrendData(duration, interval);
    const dataMap = new Map(
      data.map((item) => [formatDateJpLocal(new Date(item.period)), item]),
    );
    const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

    return emptyData.map((emptyRow) => {
      const dataRow = dataMap.get(emptyRow.period);
      const merged = dataRow ? { ...emptyRow, ...dataRow } : emptyRow;
      const date = new Date(merged.period.replace(/-/g, "/"));

      let displayPeriod = "";

      if (interval === "day") {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayLabel = dayLabels[date.getDay()];

        // 月間表示の場合、ラベルを短縮
        if (preset === "month") {
          displayPeriod =
            day === 1 ? `${month}/${day}(${dayLabel})` : `${day}${dayLabel}`;
        } else {
          displayPeriod = `${month}/${day}(${dayLabel})`;
        }
      } else {
        // 年間表示（月単位）
        const month = date.getMonth() + 1;
        displayPeriod =
          month === 1 ? `${date.getFullYear()}年1月` : `${month}月`;
      }

      return { ...merged, displayPeriod };
    });
  }, [data, duration, interval, preset]);

  const totals = useMemo(
    () => ({
      totalAmount: data.reduce((acc, curr) => acc + curr.totalAmount, 0),
      count: data.reduce((acc, curr) => acc + curr.count, 0),
    }),
    [data],
  );

  const formatYAxis = (value: number) => {
    if (activeChart === "count") return formatNumber(value);
    return format円Large(value);
  };

  return (
    <Card
      className={`h-full flex flex-col border-none shadow-none bg-transparent overflow-hidden ${isPending ? "opacity-70" : ""}`}
    >
      <CardHeader className="flex flex-row items-stretch space-y-0 border-b p-0 shrink-0 overflow-hidden">
        {/* 売上金額セクション */}
        <button
          type="button"
          data-active={activeChart === "totalAmount"}
          aria-pressed={activeChart === "totalAmount"}
          className="group flex flex-1 flex-col justify-center gap-1.5 px-6 py-4 transition-all cursor-pointer border-r text-left
                    data-[active=true]:bg-white data-[active=true]:relative
                    data-[active=false]:bg-slate-50/50 data-[active=false]:hover:bg-slate-100
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
          onClick={() => setActiveChart("totalAmount")}
        >
          {/* 選択時のみ表示される上部の強調ライン */}
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 opacity-0 group-data-[active=true]:opacity-100" />

          <span className="text-xs text-muted-foreground font-bold tracking-wider group-data-[active=true]:text-indigo-600">
            売上金額 (合計)
          </span>
          <span className="text-2xl font-black leading-none text-slate-400 group-data-[active=true]:text-indigo-700 sm:text-3xl">
            {format円(totals.totalAmount)}
          </span>
        </button>

        {/* 受注件数セクション */}
        <button
          type="button"
          data-active={activeChart === "count"}
          aria-pressed={activeChart === "count"}
          className="group flex flex-1 flex-col justify-center gap-1.5 px-6 py-4 transition-all cursor-pointer text-left
                  data-[active=true]:bg-white data-[active=true]:relative
                  data-[active=false]:bg-slate-50/50 data-[active=false]:hover:bg-slate-100
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
          onClick={() => setActiveChart("count")}
        >
          {/* 選択時のみ表示される上部の強調ライン */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 opacity-0 group-data-[active=true]:opacity-100" />

          <span className="text-xs text-muted-foreground font-bold tracking-wider group-data-[active=true]:text-slate-900">
            受注件数 (合計)
          </span>
          <span className="text-2xl font-black leading-none text-slate-400 group-data-[active=true]:text-slate-900 sm:text-3xl">
            {formatNumber(totals.count)}
            <span className="text-sm ml-1 font-bold">件</span>
          </span>
        </button>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 px-2 pt-4 pb-0">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
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
              interval={preset === "month" ? "preserveStartEnd" : 0}
              tick={(props: CustomTickProps) => <CustomXAxisTick {...props} />}
              height={50}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={formatYAxis}
              width={100}
            />
            <ChartTooltip
              cursor={{ fill: "#f1f5f9" }}
              content={
                <ChartTooltipContent
                  className="w-[140px] bg-white border-slate-200"
                  nameKey={activeChart}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill={chartConfig[activeChart].color}
              radius={[4, 4, 0, 0]}
              onClick={(p) => {
                if (!p?.period) return;
                const d = new Date(p.period.replace(/-/g, "/"));
                const end =
                  interval === "month"
                    ? new Date(d.getFullYear(), d.getMonth() + 1, 0)
                    : d;
                startTransition(() =>
                  router.push(
                    `/order?startDate=${formatDateJpLocal(d)}&endDate=${formatDateJpLocal(end)}`,
                  ),
                );
              }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
