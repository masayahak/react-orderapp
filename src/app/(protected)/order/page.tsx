import { 受注Repository } from "@/db/repository/受注Repository";

import { OrderList } from "./_components/受注List";

export default async function Page({
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

  const { items, totalCount } = await 受注Repository.Search({
    keyword: q,
    startDate,
    endDate,
    page,
    pageSize,
  });

  return (
    <div className="flex flex-col pt-8 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          受注一覧
        </h1>
      </div>
      <OrderList
        initialData={items}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  );
}
