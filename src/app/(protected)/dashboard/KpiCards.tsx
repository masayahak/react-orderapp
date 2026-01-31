"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card"; // CardContent等は使わず、自由なレイアウトで組みます
import { Banknote, ShoppingCart, Target, TrendingUp } from "lucide-react";

interface KpiCardsProps {
  data: {
    totalAmount: number;
    count: number;
  }[];
}

export function KpiCards({ data }: KpiCardsProps) {
  const stats = useMemo(() => {
    const totalSales = data.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalOrders = data.reduce((acc, curr) => acc + curr.count, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return { totalSales, totalOrders, averageOrderValue };
  }, [data]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);

  const kpiDefinitions = [
    {
      title: "総売上高",
      value: formatCurrency(stats.totalSales),
      icon: Banknote,
      description: "確定売上合計",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "受注件数",
      value: `${stats.totalOrders.toLocaleString()}件`,
      icon: ShoppingCart,
      description: "起票された受注数",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "平均客単価",
      value: formatCurrency(stats.averageOrderValue),
      icon: Target,
      description: "1受注あたりの平均",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "稼働効率",
      value: "Good",
      icon: TrendingUp,
      description: "前期間比（ダミー）",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {kpiDefinitions.map((kpi) => (
        <Card
          key={kpi.title}
          className="border-none shadow-sm overflow-hidden bg-white p-3.5"
        >
          {/* 上段：タイトルとアイコンを1列に */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {kpi.title}
            </span>
            <div className={`p-1 rounded ${kpi.bgColor}`}>
              <kpi.icon className={`h-3 w-3 ${kpi.color}`} />
            </div>
          </div>

          {/* 中段：メイン数値（ここを大きく） */}
          <div className="text-[26px] font-black tracking-tighter text-slate-900 leading-none py-1">
            {kpi.value}
          </div>

          {/* 下段：補助情報（さらに小さく） */}
          <div className="text-[9px] text-slate-400 font-medium truncate opacity-70">
            {kpi.description}
          </div>
        </Card>
      ))}
    </div>
  );
}
