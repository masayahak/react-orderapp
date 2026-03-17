import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import {
  analysisParamsSchema,
  AnalysisPreset,
  getAnalysisDefaults,
} from "@/lib/analysis-utils";
import { requireSession } from "@/lib/auth-guard";

import { ProductRankingServer } from "./_components/商品RankingServer";
import { SalesTrendServer } from "./_components/売上推移ChartServer";
import { CustomerRankingServer } from "./_components/得意先RankingServer";
import { SearchCondition } from "./_components/検索条件";

interface DashboardPageProps {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    direction?: string;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  // 認証判定
  requireSession();

  const sParams = await searchParams;

  // 1. プリセットの決定
  const preset = (sParams.preset as AnalysisPreset) || "month";
  const defaults = getAnalysisDefaults(preset);

  // 2. パラメータをZodで検証（ここに入力値を集約）
  const result = analysisParamsSchema.safeParse({
    preset: preset,
    from: sParams.from || defaults.duration.from,
    to: sParams.to || defaults.duration.to,
    direction: sParams.direction || "current",
  });

  // 3. バリデーション失敗時の処理
  if (!result.success) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 font-bold">不正な分析条件です。</p>
        <p className="text-sm text-slate-500">
          URLのパラメータを確認してください。
        </p>
      </div>
    );
  }

  // 4. transform済みのデータを取得
  const params = result.data;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50/30 overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <SearchCondition params={params} />
      </div>

      <main className="flex-1 min-h-0 px-3 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
          <div className="lg:col-span-8 h-full min-h-0">
            <Suspense
              key={JSON.stringify(params.duration)}
              fallback={<LoadingCard label="売上推移を計算中..." />}
            >
              <SalesTrendServer params={params} />
            </Suspense>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3 h-full min-h-0">
            <div className="flex-1 min-h-0">
              <Suspense
                key={JSON.stringify(params.duration)}
                fallback={<LoadingCard label="得意先別集計中..." />}
              >
                <CustomerRankingServer params={params} />
              </Suspense>
            </div>
            <div className="flex-1 min-h-0">
              <Suspense
                key={JSON.stringify(params.duration)}
                fallback={<LoadingCard label="商品別集計中..." />}
              >
                <ProductRankingServer params={params} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      <p className="text-xs text-slate-400 font-medium">{label}</p>
    </div>
  );
}
