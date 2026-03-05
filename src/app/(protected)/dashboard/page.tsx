import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { 受注分析Repository } from "@/db/repository/受注分析Repository";
import {
  AnalysisInterval,
  AnalysisPreset,
  getAnalysisDefaults,
} from "@/lib/analysis-utils";

import { CustomerRanking } from "./_components/CustomerRanking";
import { DashboardHeader } from "./_components/DashboardHeader";
import { ProductRanking } from "./_components/ProductRanking";
import { SalesTrendChart } from "./_components/SalesTrendChart";

interface DashboardPageProps {
  searchParams: Promise<{
    preset?: AnalysisPreset;
    from?: string;
    to?: string;
    interval?: AnalysisInterval;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;

  // 指定がない場合は「月間」を初期値
  const preset = params.preset || "month";
  const defaults = getAnalysisDefaults(preset);
  const duration = {
    from: params.from || defaults.duration.from,
    to: params.to || defaults.duration.to,
  };
  const interval = params.interval || defaults.interval;

  const [trendData, topCustomers, topProducts] = await Promise.all([
    受注分析Repository.GetSalesTrend(duration, interval),
    受注分析Repository.GetTopCustomers(duration),
    受注分析Repository.GetTopProducts(duration),
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50/30 overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <DashboardHeader
          activePreset={preset}
          from={duration.from}
          to={duration.to}
          activeInterval={interval}
        />
      </div>

      <main className="flex-1 min-h-0 px-3 pb-2">
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
            {/* 左側グラフエリア */}
            <div className="lg:col-span-8 h-full min-h-0">
              <section className="bg-white rounded-xl border shadow-sm p-0 h-full overflow-hidden">
                <SalesTrendChart
                  data={trendData}
                  preset={preset}
                  duration={duration}
                  interval={interval}
                />
              </section>
            </div>

            {/* 右側ランキングエリア */}
            <div className="lg:col-span-4 flex flex-col gap-3 h-full min-h-0">
              <div className="flex-1 min-h-0">
                <CustomerRanking data={topCustomers} duration={duration} />
              </div>
              <div className="flex-1 min-h-0">
                <ProductRanking data={topProducts} duration={duration} />
              </div>
            </div>
          </div>
        </Suspense>
      </main>
    </div>
  );
}
