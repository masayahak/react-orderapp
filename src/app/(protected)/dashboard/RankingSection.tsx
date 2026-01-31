"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const maxValue = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;
  }, [data]);

  const Icon = type === "customer" ? Users : Package;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      notation: "compact",
    })
      .format(val)
      .replace("￥", "¥");

  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-md">
            <Icon className="h-3.5 w-3.5 text-slate-600" />
          </div>
          <CardTitle className="text-xs font-bold text-slate-700 uppercase">
            {title}
          </CardTitle>
        </div>
        <Trophy className="h-3.5 w-3.5 text-amber-400 opacity-40" />
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-5">
        {data.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-[10px] text-slate-400 italic">
            データなし
          </div>
        ) : (
          // ★ここで index をしっかり受け取る
          data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

            return (
              <div key={item.name} className="space-y-1 group">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-300 w-3">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-800">
                    {formatCurrency(item.value)}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      index === 0
                        ? "bg-indigo-500"
                        : "bg-slate-300 group-hover:bg-indigo-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
