import { 受注Repository } from "@/db/repository/受注Repository";

import { OrderList } from "./受注List";

export async function OrderListServer({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const q = (params.q as string) || "";
  const startDate = (params.startDate as string) || "";
  const endDate = (params.endDate as string) || "";
  const pageSize = Number(process.env.PAGE_ROW_COUNT) || 20;

  // データフェッチをコンポーネントのすぐそばで行う
  const { items, totalCount } = await 受注Repository.Search({
    keyword: q,
    startDate,
    endDate,
    page,
    pageSize,
  });

  return (
    <OrderList
      initialData={items}
      totalCount={totalCount}
      pageSize={pageSize}
    />
  );
}
