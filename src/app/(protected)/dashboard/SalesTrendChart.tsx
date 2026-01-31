"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  // 1. 表示用のフォーマット処理（DBの期間文字列を人間が読みやすい形式に）
  const chartData = useMemo(() => {
    return data.map((item) => {
      const date = new Date(item.period);
      let label = "";

      switch (interval) {
        case "day":
          label = `${date.getMonth() + 1}/${date.getDate()}`; // "1/31"
          break;
        case "week":
          label = `${date.getMonth() + 1}/${date.getDate()}~`; // "1/26~"
          break;
        case "month":
          label = `${date.getFullYear()}/${date.getMonth() + 1}`; // "2026/1"
          break;
      }

      return {
        ...item,
        displayPeriod: label,
      };
    });
  }, [data, interval]);

  // 通貨フォーマッタ
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      notation: "compact", // "1.2M" などの短縮表記を有効にする（軸用）
    }).format(value);

  return (
    <Card className="border-none shadow-sm h-full bg-white/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          売上高推移 (
          {interval === "day" ? "日次" : interval === "week" ? "週次" : "月次"})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="displayPeriod"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(val) => `¥${val.toLocaleString()}`}
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border p-3 rounded-lg shadow-xl">
                        <p className="text-xs font-bold text-slate-400 mb-1">
                          {data.displayPeriod}
                        </p>
                        <p className="text-lg font-black text-indigo-600">
                          {formatCurrency(data.totalAmount).replace("￥", "¥ ")}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 border-t pt-1">
                          受注件数:{" "}
                          <span className="font-bold">{data.count} 件</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="totalAmount"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSales)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
