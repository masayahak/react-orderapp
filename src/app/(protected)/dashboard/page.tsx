import { Suspense } from "react";
import {
  getAnalysisDefaults,
  AnalysisPreset,
  AnalysisInterval,
} from "@/lib/analysis-utils";
import { 受注分析Repository } from "@/db/repository/受注分析Repository";
import { DashboardHeader } from "./DashboardHeader";
import { KpiCards } from "./KpiCards";
import { SalesTrendChart } from "./SalesTrendChart";
import { RankingSection } from "./RankingSection";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

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
  // 1. パラメータの解決（Next.js 15の非同期searchParamsに対応）
  const params = await searchParams;

  // 2. プリセットからデフォルト値を生成
  const preset = params.preset || "month";
  const defaults = getAnalysisDefaults(preset);

  // 3. パラメータの確定（URL優先 ＞ デフォルト）
  const duration = {
    from: params.from || defaults.duration.from,
    to: params.to || defaults.duration.to,
  };
  const interval = params.interval || defaults.interval;

  // 4. データの一括取得（Promise.allによる並列実行でTTFBを最適化）
  const [trendData, topCustomers, topProducts] = await Promise.all([
    受注分析Repository.GetSalesTrend(duration, interval),
    受注分析Repository.GetTopCustomers(duration),
    受注分析Repository.GetTopProducts(duration),
  ]);

  return (
    <div className="min-h-screen bg-slate-50/30 p-4 md:p-8 space-y-8">
      {/* 司令塔：期間・単位コントロール */}
      <DashboardHeader
        activePreset={preset}
        from={duration.from}
        to={duration.to}
        activeInterval={interval}
      />

      <Separator className="bg-slate-200/60" />

      {/* Suspenseで囲むことで、データロード中のUXを担保。
          （実際はサーバーサイドでPromise.allを待つが、入れ子構造に備える）
      */}
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        }
      >
        <div className="space-y-8">
          {/* 上段：KPIメトリクス */}
          <section>
            <KpiCards data={trendData} />
          </section>

          {/* 中段：メイン分析エリア */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左側 2/3：売上推移グラフ */}
            <div className="lg:col-span-2 h-fit">
              <SalesTrendChart data={trendData} interval={interval} />
            </div>

            {/* 右側 1/3：ランキングセクション */}
            <div className="space-y-8">
              <RankingSection
                title="得意先別売上"
                data={topCustomers}
                type="customer"
              />
              <RankingSection
                title="商品別売上"
                data={topProducts}
                type="product"
              />
            </div>
          </div>
        </div>
      </Suspense>

      {/* フッター：データ整合性メタ情報 */}
      <footer className="pt-8 text-[10px] text-slate-400 flex justify-between items-center border-t border-dashed">
        <p>
          Analysis Range: {duration.from} to {duration.to} (Interval: {interval}
          )
        </p>
        <p className="font-mono">System Date: 2026-01-31</p>
      </footer>
    </div>
  );
}
