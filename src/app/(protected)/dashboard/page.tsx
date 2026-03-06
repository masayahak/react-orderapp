import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { 受注分析Repository } from "@/db/repository/受注分析Repository";
import {
  AnalysisParams,
  AnalysisPreset,
  getAnalysisDefaults,
  getIntervalByPreset,
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
    // interval は外部から受け取らないため削除
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const sParams = await searchParams;

  // 1. まずプリセットを確定
  const preset = sParams.preset || "month";

  // 2. プリセットに応じたデフォルト期間を取得
  const defaults = getAnalysisDefaults(preset);

  // 3. AnalysisParams 構造体を組み立てる
  const params: AnalysisParams = {
    preset,
    duration: {
      from: sParams.from || defaults.duration.from,
      to: sParams.to || defaults.duration.to,
    },
    // URLではなく、確定した preset から関数従属で決定
    interval: getIntervalByPreset(preset),
    direction: "current",
  };

  // 4. 組み立てた params を使用してデータを取得
  const [trendData, topCustomers, topProducts] = await Promise.all([
    受注分析Repository.GetSalesTrend(params.duration, params.interval),
    受注分析Repository.GetTopCustomers(params.duration),
    受注分析Repository.GetTopProducts(params.duration),
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50/30 overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <DashboardHeader params={params} />
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
            <div className="lg:col-span-8 h-full min-h-0">
              <section className="bg-white rounded-xl border shadow-sm p-0 h-full overflow-hidden">
                <SalesTrendChart data={trendData} params={params} />
              </section>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 h-full min-h-0">
              <div className="flex-1 min-h-0">
                <CustomerRanking data={topCustomers} params={params} />
              </div>
              <div className="flex-1 min-h-0">
                <ProductRanking data={topProducts} params={params} />
              </div>
            </div>
          </div>
        </Suspense>
      </main>
    </div>
  );
}
