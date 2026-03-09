import { 受注分析Repository } from "@/db/repository/受注分析Repository";
import { AnalysisParams } from "@/lib/analysis-utils";

import { SalesTrendChart } from "./売上推移Chart";

export async function SalesTrendServer({ params }: { params: AnalysisParams }) {
  // データの取得をこのコンポーネントにコロケーション
  // Repository側で cache されているため、他と重複しても1クエリに集約される
  const data = await 受注分析Repository.GetSalesTrend(
    params.duration,
    params.interval,
  );

  return (
    <section className="bg-white rounded-xl border shadow-sm p-0 h-full overflow-hidden">
      <SalesTrendChart data={data} params={params} />
    </section>
  );
}
