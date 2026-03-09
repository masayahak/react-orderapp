import { 受注分析Repository } from "@/db/repository/受注分析Repository";
import { AnalysisParams } from "@/lib/analysis-utils";

import { CustomerRanking } from "./得意先Ranking";

export async function CustomerRankingServer({
  params,
}: {
  params: AnalysisParams;
}) {
  const data = await 受注分析Repository.GetTopCustomers(params.duration);

  return (
    <div className="h-full">
      <CustomerRanking data={data} params={params} />
    </div>
  );
}
