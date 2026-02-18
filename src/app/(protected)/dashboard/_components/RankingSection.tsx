"use client";

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
import { Users, Package, Trophy } from "lucide-react";

interface RankingData {
  name: string;
  value: number;
}

interface RankingSectionProps {
  title: string;
  data: RankingData[];
  type: "customer" | "product";
}

export function RankingSection({ title, data, type }: RankingSectionProps) {
  const Icon = type === "customer" ? Users : Package;

  // 上位5件のみ
  const chartData = useMemo(() => {
    return (data || []).slice(0, 5).map((item) => ({
      ...item,
      fill: type === "customer" ? "#f97316" : "#10b981", // Customer: Orange, Product: Emerald
    }));
  }, [data, type]);

  const chartConfig = {
    value: {
      label: type === "customer" ? "売上高" : "販売額",
      color: type === "customer" ? "#f97316" : "#10b981",
    },
  } satisfies ChartConfig;

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
          <div
            className={`p-1.5 rounded-md ${type === "customer" ? "bg-indigo-50" : "bg-emerald-50"}`}
          >
            <Icon
              className={`h-3.5 w-3.5 ${type === "customer" ? "text-indigo-600" : "text-emerald-600"}`}
            />
          </div>
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {title}
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
              // バー間の隙間を調整して太さを確保
              barCategoryGap="20%"
            >
              <CartesianGrid horizontal={false} vertical={false} />

              <XAxis type="number" hide />

              {/* Y軸（左側）: 名前を表示
                width={110} で日本語名を表示するスペースを確保
                tickLine={false} で線は消す
              */}
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 11,
                  fill: "#334155", // slate-700
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
                fill={type === "customer" ? "#f97316" : "#10b981"} // Customer: Orange, Product: Emerald
                onClick={(data) => {
                  if (!data || !data.name) return;
                  // URL検索パラメータから期間を取得する（DashboardHeaderがURLを管理しているため）
                  // Server Component経由ではなく、クライアントサイドで現在のURLSearchParamsを参照
                  const searchParams = new URLSearchParams(
                    window.location.search,
                  );
                  const from = searchParams.get("from") || "";
                  const to = searchParams.get("to") || "";

                  // キーワード検索として遷移 (encodeURIComponentはブラウザが自動で行うが、明示的に書くのが安全)
                  // 受注一覧などへ遷移してフィルタリング
                  const q = encodeURIComponent(data.name);

                  window.location.href = `/order?startDate=${from}&endDate=${to}&q=${q}`;
                }}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {/* 右側に数値を表示 */}
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
