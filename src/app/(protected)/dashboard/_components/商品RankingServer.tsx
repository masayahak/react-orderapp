import { 受注分析Repository } from "@/db/repository/受注分析Repository";
import { AnalysisParams } from "@/lib/analysis-utils";

import { ProductRanking } from "./商品Ranking";

export async function ProductRankingServer({
  params,
}: {
  params: AnalysisParams;
}) {
  const data = await 受注分析Repository.GetTopProducts(params.duration);

  return (
    <div className="h-full">
      <ProductRanking data={data} params={params} />
    </div>
  );
}
