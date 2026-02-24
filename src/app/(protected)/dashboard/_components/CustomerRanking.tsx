"use client";

import { Trophy,Users } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface RankingData {
  name: string;
  value: number;
}

interface CustomerRankingProps {
  data: RankingData[];
  from: string;
  to: string;
}

const chartConfig = {
  value: {
    label: "売上高",
    color: "#B07D62",
  },
} satisfies ChartConfig;

export function CustomerRanking({ data, from, to }: CustomerRankingProps) {
  // 上位5件のみ
  const chartData = useMemo(() => {
    return (data || []).slice(0, 5).map((item) => ({
      ...item,
      fill: chartConfig.value.color,
    }));
  }, [data]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      notation: "compact",
      maximumFractionDigits: 1,
    })
      .format(val)
      .replace("￥", "¥");

  return (
    <Card className="flex flex-col border-none shadow-sm bg-white h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-indigo-50">
            <Users className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            得意先別売上
          </CardTitle>
        </div>
        <Trophy className="h-3.5 w-3.5 text-amber-400 opacity-50" />
      </CardHeader>

      <CardContent className="flex-1 px-2 pb-0 min-h-0">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
            データなし
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid horizontal={false} vertical={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 11,
                  fill: "#334155",
                  fontWeight: 600,
                }}
              />
              <ChartTooltip
                cursor={{ fill: "#f1f5f9" }}
                content={
                  <ChartTooltipContent
                    className="bg-white border-slate-200"
                    indicator="line"
                    formatter={(value) => (
                      <span className="font-mono font-bold text-slate-700">
                        {formatCurrency(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="value"
                layout="vertical"
                radius={[0, 4, 4, 0]}
                fill="#f97316"
                onClick={(data) => {
                  if (!data || !data.name) return;
                  const q = encodeURIComponent(data.name);
                  window.location.href = `/order?startDate=${from}&endDate=${to}&q=${q}`;
                }}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <LabelList
                  dataKey="value"
                  position="right"
                  offset={8}
                  className="fill-slate-500"
                  fontSize={11}
                  formatter={(val: number) => formatCurrency(val)}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
